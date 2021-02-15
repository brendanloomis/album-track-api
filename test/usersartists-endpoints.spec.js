const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeArtistsArray } = require('./artists.fixtures');
const { makeUsersArray } = require('./users.fixtures');
const { makeUsersArtistsArray } = require('./usersartists.fixtures');

describe('UsersArtists Endpoints', () => {
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

    describe('Unauthorized requests', () => {
        const testArtists = makeArtistsArray();
        const testUsers = makeUsersArray();
        const testUsersArtists = makeUsersArtistsArray();

        beforeEach('insert usersartists', () => {
            return db
                .into('artists')
                .insert(testArtists)
                .then(() => {
                    return db
                        .into('users')
                        .insert(testUsers)
                        .then(() => {
                            return db
                                .into('usersartists')
                                .insert(testUsersArtists);
                        });
                });
        });

        it(`responds with 401 Unauthorized for GET /api/usersartists`, () => {
            return supertest(app)
                .get('/api/usersartists')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/usersartists`, () => {
            return supertest(app)
                .post('/api/usersartists')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/usersartists/:usersartists_id`, () => {
            const userArtist = testUsersArtists[1];
            return supertest(app)
                .get(`/api/usersartists/${userArtist.usersartists_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/usersartists/:usersartists_id`, () => {
            const userArtist = testUsersArtists[1];
            return supertest(app)
                .delete(`/api/usersartists/${userArtist.usersartists_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe('GET /api/usersartists', () => {
        context(`Given there are usersartists in the database`, () => {
            const testArtists = makeArtistsArray();
            const testUsers = makeUsersArray();
            const testUsersArtists = makeUsersArtistsArray();
    
            beforeEach('insert usersartists', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('users')
                            .insert(testUsers)
                            .then(() => {
                                return db
                                    .into('usersartists')
                                    .insert(testUsersArtists);
                            });
                    });
            });

            it(`responds with 200 and a list of artists`, () => {
                const userId = 1;
                const expected = [
                    {
                        usersartists_id: 1,
                        artist_id: 1,
                        artist_name: 'Ariana Grande'
                    },
                    {
                        usersartists_id: 2,
                        artist_id: 2,
                        artist_name: 'Troye Sivan'
                    }
                ];

                return supertest(app)
                    .get(`/api/usersartists?userId=${userId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expected);
            });
        });
    });

    describe('GET /api/usersartists/:usersartists_id', () => {
        context(`Given no usersartists`, () => {
            it(`responds 404 when userartist doesn't exist`, () => {
                const userArtistId = 123456;
                return supertest(app)
                    .get(`/api/usersartists/${userArtistId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `User Artist doesn't exist` }
                    });
            });
        });

        context(`Given there are usersartists in the database`, () => {
            const testArtists = makeArtistsArray();
            const testUsers = makeUsersArray();
            const testUsersArtists = makeUsersArtistsArray();
    
            beforeEach('insert usersartists', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('users')
                            .insert(testUsers)
                            .then(() => {
                                return db
                                    .into('usersartists')
                                    .insert(testUsersArtists);
                            });
                    });
            });

            it(`responds with 200 and the specified user artist`, () => {
                const userArtistId = 2;
                const expectedUserArtist = testUsersArtists[userArtistId - 1];

                return supertest(app)
                    .get(`/api/usersartists/${userArtistId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedUserArtist);
            });
        });
    });

    describe('DELETE /api/usersartists/:usersartists_id', () => {
        context(`Given no usersartists`, () => {
            it(`responds with 404 when user artist doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/usersartists/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `User Artist doesn't exist` }
                    });
            });
        });

        context(`Given there are usersartists in the database`, () => {
            const testArtists = makeArtistsArray();
            const testUsers = makeUsersArray();
            const testUsersArtists = makeUsersArtistsArray();
    
            beforeEach('insert usersartists', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('users')
                            .insert(testUsers)
                            .then(() => {
                                return db
                                    .into('usersartists')
                                    .insert(testUsersArtists);
                            });
                    });
            });

            it(`responds with 204 and removes the user artist`, () => {
                const idToRemove = 2;
                const expectedUsersArtists = testUsersArtists.filter(ua => ua.usersartists_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/usersartists/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/usersartists`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedUsersArtists);
                    });
            });
        })
    })
});