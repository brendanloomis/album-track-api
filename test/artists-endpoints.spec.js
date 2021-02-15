const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeArtistsArray, makeMaliciousArtist } = require('./artists.fixtures');

describe(`Artists Endpoints`, () => {
    let db;

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });
        app.set('db', db);
    });

    after(`disconnect from db`, () => db.destroy());

    before(`clean the table`, () => db.raw('TRUNCATE artists, albums, users, usersalbums, songs, usersartists'));

    afterEach(`cleanup`, () => db.raw('TRUNCATE artists, albums, users, usersalbums, songs, usersartists'));

    describe(`Unauthorized Requests`, () => {
        const testArtists = makeArtistsArray();

        beforeEach(`insert artists`, () => {
            return db
                .into('artists')
                .insert(testArtists);
        });

        it(`responds with 401 Unauthorized for GET /api/artists`, () => {
            return supertest(app)
                .get('/api/artists')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/artists`, () => {
            return supertest(app)
                .post('/api/artists')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized fro GET /api/artists/:artist_id`, () => {
            const secondArtist = testArtists[1];
            return supertest(app)
                .get(`/api/artists/${secondArtist}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/artists/:artist_id`, () => {
            const artist = testArtists[1];
            return supertest(app)
                .delete(`/api/artists/${artist.artist_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/artists/:artist_id`, () => {
            const artist = testArtists[1];
            return supertest(app)
                .patch(`/api/artists/${artist.artist_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/artists`, () => {
        context(`Given no artists`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/artists')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are artists in the database`, () => {
            const testArtists = makeArtistsArray();

            beforeEach('insert artists', () => {
                return db
                    .into('artists')
                    .insert(testArtists);
            });

            it(`responds with 200 and all of the artists`, () => {
                return supertest(app)
                    .get('/api/artists')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testArtists);
            });
        });

        context(`Given an XSS attack artist`, () => {
            const { maliciousArtist, expectedArtist } = makeMaliciousArtist();

            beforeEach('insert malicious artist', () => {
                return db
                    .into('artists')
                    .insert([maliciousArtist]);
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/artists`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].artist_name).to.eql(expectedArtist.artist_name);
                    });
            });
        });
    });

    describe(`GET /api/artists/:artist_id`, () => {
        context(`Given no artits`, () => {
            it(`responds with 404 when artist doesn't exist`, () => {
                const artistId = 123456;
                return supertest(app)
                    .get(`/api/artists/${artistId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: {
                            message: `Artist doesn't exist`
                        }
                    });
            });
        });

        context(`Given there are artists in the database`, () => {
            const testArtists = makeArtistsArray();

            beforeEach('insert artists', () => {
                return db
                    .into('artists')
                    .insert(testArtists);
            });

            it(`responds with 200 and the specified artist`, () => {
                const artistId = 2;
                const expectedArtist = testArtists[artistId - 1];

                return supertest(app)
                    .get(`/api/artists/${artistId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedArtist);
            });
        });

        context(`Given an XSS attack artist`, () => {
            const { maliciousArtist, expectedArtist } = makeMaliciousArtist();

            beforeEach('insert malicious artist', () => {
                return db
                    .into('artists')
                    .insert([maliciousArtist]);
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/artists/${maliciousArtist.artist_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.artist_name).to.eql(expectedArtist.artist_name);
                    });
            });
        });
    });

    describe(`DELETE /api/artists/:artist_id`, () => {
        context(`Given no artists`, () => {
            it(`responds with 404 when artist doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/artists/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Artist doesn't exist` }
                    });
            });
        });

        context(`Given there are artists`, () => {
            const testArtists = makeArtistsArray();

            beforeEach('insert artists', () => {
                return db
                    .into('artists')
                    .insert(testArtists);
            });

            it(`responds with 204 and removes artist`, () => {
                const idToRemove = 2;
                const expectedArtists = testArtists.filter(a => a.artist_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/artists/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('/api/artists')
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedArtists);
                    });
            });
        });
    });

    describe(`POST /api/artists`, () => {
        it(`responds with 400 and an error message when 'artist_name' is missing`, () => {
            const newArtist = {
                artist_name: ''
            };

            return supertest(app)
                .post('/api/artists')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newArtist)
                .expect(400, {
                    error: { message: `Missing 'artist_name' in request body` }
                });
        });

        it(`creates an artist, responding with 201 and the new artist`, () => {
            const newArtist = {
                artist_name: 'Taylor Swift'
            };

            return supertest(app)
                .post('/api/artists')
                .send(newArtist)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.artist_name).to.eql(newArtist.artist_name);
                    expect(res.body).to.have.property('artist_id');
                    expect(res.headers.location).to.eql(`/api/artists/${res.body.artist_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/artists/${postRes.body.artist_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousArtist, expectedArtist } = makeMaliciousArtist();

            return supertest(app)
                .post('/api/artists')
                .send(maliciousArtist)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.artist_name).to.eql(expectedArtist.artist_name);
                });
        });
    });

    describe(`PATCH /api/artists/:artist_id`, () => {
        context(`Given no artists`, () => {
            it(`responds with 404`, () => {
                const artistId = 123456;
                return supertest(app)
                    .patch(`/api/artists/${artistId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Artist doesn't exist` } });
            });
        });

        context(`Given there are artists in the database`, () => {
            const testArtists = makeArtistsArray();

            beforeEach('insert artists', () => {
                return db
                    .into('artists')
                    .insert(testArtists);
            });

            it(`responds with 204 and updates the artist`, () => {
                const idToUpdate = 2;
                const updateArtist = {
                    artist_name: 'Update name'
                };
                const expectedArtist = {
                    ...testArtists[idToUpdate - 1],
                    ...updateArtist
                };

                return supertest(app)
                    .patch(`/api/artists/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateArtist)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/artists/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedArtist);
                    });
            });

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 1;
                return supertest(app)
                    .patch(`/api/artists/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain 'artist_name'`
                        }
                    });
            });
        });
    });
});
