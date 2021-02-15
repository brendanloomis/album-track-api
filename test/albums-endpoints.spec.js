const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeAlbumsArray, makeMaliciousAlbum } = require('./albums.fixtures');
const { makeArtistsArray } = require('./artists.fixtures');

describe(`Albums endpoints`, () => {
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

    describe(`Unauthorized requests`, () => {
        const testArtists = makeArtistsArray();
        const testAlbums = makeAlbumsArray();

        beforeEach('insert albums', () => {
            return db
                .into('artists')
                .insert(testArtists)
                .then(() => {
                    return db
                        .into('albums')
                        .insert(testAlbums);
                });
        });

        it(`responds with 401 Unauthorized for GET /api/albums`, () => {
            return supertest(app)
                .get('/api/albums')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/albums`, () => {
            return supertest(app)
                .post('/api/albums')
                .expect(401, { error: 'Unauthorized request' });
        });

        it('responds with 401 Unauthorized for GET /api/albums/:album_id', () => {
            const album = testAlbums[1];
            return supertest(app)
                .get(`/api/albums/${album.album_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/albums/:album_id`, () => {
            const album = testAlbums[1];
            return supertest(app)
                .delete(`/api/albums/${album.album_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/albums/:album_id`, () => {
            const album = testAlbums[1];
            return supertest(app)
                .patch(`/api/albums/${album.album_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/albums`, () => {
        context(`Given no albums`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/albums')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are albums in the database`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();

            beforeEach('insert albums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums);
                    });
            });

            it(`responds with 200 and all of the albums`, () => {
                return supertest(app)
                    .get('/api/albums')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testAlbums);
            });
        });

        context(`Given an XSS attack album`, () => {
            const { maliciousAlbum, expectedAlbum } = makeMaliciousAlbum();
            const testArtists = makeArtistsArray();

            beforeEach('insert malicious album', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(maliciousAlbum);
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get('/api/albums')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].album_name).to.eql(expectedAlbum.album_name);
                        expect(res.body[0].genre).to.eql(expectedAlbum.genre);
                    });
            });
        });
    });

    describe(`GET /api/albums/:album_id`, () => {
        context(`Given no albums`, () => {
            const albumId = 123456;
            return supertest(app)
                .get(`/api/albums/${albumId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, {
                    error: { message: `Album doesn't exist` }
                });
        });

        context(`Given there are albums in the database`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();

            beforeEach('insert albums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums);
                    });
            });

            it(`responds with 200 and the specified album`, () => {
                const albumId = 2;
                const expectedAlbum =  testAlbums[albumId - 1];

                return supertest(app)
                    .get(`/api/albums/${albumId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedAlbum);
            });
        });

        context(`Given an XSS attack album`, () => {
            const { maliciousAlbum, expectedAlbum } = makeMaliciousAlbum();
            const testArtists = makeArtistsArray();

            beforeEach('insert malicious album', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(maliciousAlbum);
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/albums/${maliciousAlbum.album_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.album_name).to.eql(expectedAlbum.album_name);
                        expect(res.body.genre).to.eql(expectedAlbum.genre);
                    });
            });
        });
    });

    describe(`DELETE /api/albums/:album_id`, () => {
        context(`Given no albums`, () => {
            it(`responds with 404 when album doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/albums/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Album doesn't exist` }
                    });
            });
        });

        context(`Given there are albums`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();

            beforeEach('insert albums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums);
                    });
            });

            it(`responds with 204 and removes the album`, () => {
                const idToRemove = 2;
                const expectedAlbums = testAlbums.filter(al => al.album_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/albums/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/albums`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedAlbums);
                    });
            });
        });
    });

    describe(`POST /api/albums`, () => {
        const testArtists = makeArtistsArray();

        beforeEach('insert artists', () => {
            return db
                .into('artists')
                .insert(testArtists);
        });

        const requiredFields = ['album_name', 'genre', 'artist'];

        requiredFields.forEach(field => {
            const newAlbum = {
                album_name: 'Test name',
                genre: 'Test genre',
                artist: 1
            };

            it(`responds with 400 and an error message when ${field} is missing`, () => {
                delete newAlbum[field];

                return supertest(app)
                    .post('/api/albums')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newAlbum)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates an album, responding with 201 and the new album`, () => {
            const newAlbum = {
                album_name: 'Test',
                genre: 'test genre',
                artist: 1
            };

            return supertest(app)
                .post(`/api/albums/`)
                .send(newAlbum)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.album_name).to.eql(newAlbum.album_name);
                    expect(res.body.genre).to.eql(newAlbum.genre);
                    expect(res.body.artist).to.eql(newAlbum.artist);
                    expect(res.body).to.have.property('album_id');
                    expect(res.headers.location).to.eql(`/api/albums/${res.body.album_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/albums/${postRes.body.album_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousAlbum, expectedAlbum } = makeMaliciousAlbum();

            return supertest(app)
                .post('/api/albums')
                .send(maliciousAlbum)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.album_name).to.eql(expectedAlbum.album_name);
                    expect(res.body.genre).to.eql(expectedAlbum.genre);
                });
        });
    });

    describe(`PATCH /api/albums/:album_id`, () => {
        context(`Given no albums`, () => {
            it(`responds with 404 when album doesn't exist`, () => {
                return supertest(app)
                    .patch(`/api/albums/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Album doesn't exist` }
                    });
            });
        });

        context(`Given there are albums`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();

            beforeEach('insert albums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums);
                    });
            });

            it(`responds with 204 and updates the album`, () => {
                const idToUpdate = 2;
                const updateAlbum = {
                    album_name: 'Updated',
                    genre: 'update',
                    artist: 3
                };
                const expectedAlbum = {
                    ...testAlbums[idToUpdate - 1],
                    ...updateAlbum
                };

                return supertest(app)
                    .patch(`/api/albums/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateAlbum)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/albums/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedAlbum);
                    });
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2;
                const updateAlbum = {
                    album_name: 'update'
                };
                const expectedAlbum = {
                    ...testAlbums[idToUpdate - 1],
                    ...updateAlbum
                };

                return supertest(app)
                    .patch(`/api/albums/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateAlbum,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/albums/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedAlbum);
                    });
            });
        });
    });
});