const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeUsersArray, makeUsernamesArray, makeMaliciousUser } = require('./users.fixtures');

describe('Users Endpoints', () => {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });
        app.set('db', db);
    });

    after(`disconnect from db`, () => db.destroy());

    before(`clean the table`, () => db.raw('TRUNCATE artists, albums, users, usersalbums, songs, usersartists'));

    afterEach(`cleanup`, () => db.raw('TRUNCATE artists, albums, users, usersalbums, songs, usersartists'));

    describe(`Unauthorized request`, () => {
        const testUsers = makeUsersArray();

        beforeEach('insert users', () => {
            return db
                .into('users')
                .insert(testUsers);
        });

        it(`responds with 401 Unauthorized for POST /api/users`, () => {
            return supertest(app)
                .post('/api/users')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/users/login`, () => {
            return supertest(app)
                .post(`/api/users/login`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/users/usernames`, () => {
            return supertest(app)
                .get('/api/users/usernames')
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`POST /api/users`, () => {
        const requiredFields = ['first_name', 'last_name', 'username', 'password'];

        requiredFields.forEach(field => {
            const newUser = {
                first_name: 'Jess',
                last_name: 'Test',
                username: 'jesstest',
                password: 'pass12word'
            };

            it(`responds with 400 and an error when the ${field} is missing`, () => {
                delete newUser[field];

                return supertest(app)
                    .post(`/api/users`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newUser)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates a user, responding with 201 and the new user`, () => {
            const newUser = {
                first_name: 'Jess',
                last_name: 'Test',
                username: 'jesstest',
                password: 'pass12word'
            };

            return supertest(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.first_name).to.eql(newUser.first_name);
                    expect(res.body.last_name).to.eql(newUser.last_name);
                    expect(res.body.username).to.eql(newUser.username);
                    expect(res.body.password).to.eql(newUser.password);
                    expect(res.body).to.have.property('user_id');
                    expect(res.headers.location).to.eql(`/api/users/${res.body.user_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/users/${postRes.body.user_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousUser, expectedUser } = makeMaliciousUser();

            return supertest(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(maliciousUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.first_name).to.eql(expectedUser.first_name);
                    expect(res.body.last_name).to.eql(expectedUser.last_name);
                    expect(res.body.username).to.eql(expectedUser.username);
                    expect(res.body.password).to.eql(expectedUser.password);
                });
        });
    });

    describe(`POST /api/users/login`, () => {
        context(`Given no users`, () => {
            it(`responds with 404 when user doesn't exist`, () => {
                const login = {
                    username: 'wow',
                    password: 'salksf123'
                };

                return supertest(app)
                    .post('/api/users/login')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(login)
                    .expect(404, {
                        error: { message: `User doesn't exist`}
                    });
            });
        });

        context(`Given there are users in database`, () => {
            const testUsers = makeUsersArray();

            beforeEach('insert users', () => {
                return db
                    .into('users')
                    .insert(testUsers);
            });

            const requiredFields = ['username', 'password'];

            requiredFields.forEach(field => {
                const login = {
                    username: 'test',
                    password: 'pw123456'
                };

                it(`responds with 400 and an error message then the ${field} is missing`, () => {
                    delete login[field];

                    return supertest(app)
                        .post('/api/users/login')
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send(login)
                        .expect(400, {
                            error: { message: `Request body must contain 'username' and 'password'` }
                        });
                });
            });

            it(`responds with 401 Unauthorized when password is incorrect`, () => {
                const login = {
                    username: 'test',
                    password: 'sfjkd'
                };

                return supertest(app)
                    .post('/api/users/login')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(login)
                    .expect(401, {
                        error: { message: 'Incorrect password' }
                    });
            });

            it(`responds with 200 and the user information (not including password)`, () => {
                const login = {
                    username: 'test',
                    password: 'pw123456'
                };
                const expectedUser = testUsers[0];
                delete expectedUser['password'];

                return supertest(app)
                    .post('/api/users/login')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(login)
                    .expect(200, expectedUser);
            });
        });
    });

    describe('GET /api/users/usernames', () => {
        context(`Given no users`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/users/usernames')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, []);
            });
        });

        context(`Given there are users in the database`, () => {
            const testUsers = makeUsersArray();

            beforeEach('insert users', () => {
                return db
                    .into('users')
                    .insert(testUsers);
            });

            it(`responds with 200 and all of the users`, () => {
                const usernames = makeUsernamesArray();
                return supertest(app)
                    .get('/api/users/usernames')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, usernames);
            });
        });

        context(`Given an XSS attack username`, () => {
            const { maliciousUser, expectedUser } = makeMaliciousUser();

            beforeEach('insert malicious user', () => {
                return db
                    .into('users')
                    .insert(maliciousUser);
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get('/api/users/usernames')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].username).to.eql(expectedUser.username);
                    });
            });
        });
    });
});