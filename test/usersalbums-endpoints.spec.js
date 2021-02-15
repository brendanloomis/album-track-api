const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeUsersAlbumsArray } = require('./usersalbums.fixtures');
const { makeArtistsArray } = require('./artists.fixtures');
const { makeAlbumsArray } = require('./albums.fixtures');
const { makeUsersArray } = require('./users.fixtures');

describe('UsersAlbums Endpoints', () => {
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
        const testUsers = makeUsersArray();
        const testUsersAlbums = makeUsersAlbumsArray();

        beforeEach('insert usersalbums', () => {
            return db
                .into('artists')
                .insert(testArtists)
                .then(() => {
                    return db
                        .into('albums')
                        .insert(testAlbums)
                        .then(() => {
                            return db
                                .into('users')
                                .insert(testUsers)
                                .then(() => {
                                    return db
                                        .into('usersalbums')
                                        .insert(testUsersAlbums);
                                });
                        });
                });
        });

        it(`responds with 401 Unauthorized for GET /api/usersalbums`, () => {
            return supertest(app)
                .get('/api/usersalbums')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/usersalbums`, () => {
            return supertest(app)
                .post('/api/usersalbums')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/usersalbums/:usersalbums_id`, () => {
            const userAlbum = testUsersAlbums[1];
            return supertest(app)
                .get(`/api/usersalbums/${userAlbum.usersalbums_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/usersalbums/:usersalbums_id`, () => {
            const userAlbum = testUsersAlbums[1];
            return supertest(app)
                .delete(`/api/usersalbums/${userAlbum.usersalbums_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/usersalbums`, () => {
        context(`Given there are usersalbums in the database`, () => {
            const testArtists = makeArtistsArray();
            const testUsers = makeUsersArray();
            const testAlbums = makeAlbumsArray();
            const testUsersAlbums = makeUsersAlbumsArray();

            beforeEach('insert usersalbums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('users')
                                    .insert(testUsers)
                                    .then(() => {
                                        return db
                                            .into('usersalbums')
                                            .insert(testUsersAlbums);
                                    });
                            });
                    });
            });

            it(`responds with 200 and a list of albums`, () => {
                const userId = 1;
                const expected = [
                    {
                        usersalbums_id: 1,
                        album: 1,
                        album_name: 'My Album',
                        genre: 'Pop',
                        artist: 1,
                    },
                    {
                        usersalbums_id: 2,
                        album: 2,
                        album_name: 'My 2nd Album',
                        genre: 'Pop',
                        artist: 1,
                    },
                ];

                return supertest(app)
                    .get(`/api/usersalbums?userId=${userId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expected);
            });
        });
    });

    describe(`GET /api/usersalbums/:usersalbums_id`, () => {
        context(`Given no usersalbums`, () => {
            it(`responds 404 when useralbum doesn't exist`, () => {
                const userAlbumId = 123456;
                return supertest(app)
                    .get(`/api/usersalbums/${userAlbumId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `User Album doesn't exist` }
                    });
            });
        });

        context(`Given there are usersalbums in the database`, () => {
            const testArtists = makeArtistsArray();
            const testUsers = makeUsersArray();
            const testAlbums = makeAlbumsArray();
            const testUsersAlbums = makeUsersAlbumsArray();

            beforeEach('insert usersalbums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('users')
                                    .insert(testUsers)
                                    .then(() => {
                                        return db
                                            .into('usersalbums')
                                            .insert(testUsersAlbums);
                                    });
                            });
                    });
            });

            it(`responds with 200 and the specified user album`, () => {
                const userAlbumId = 2;
                const expectedUserAlbum = testUsersAlbums[userAlbumId - 1];

                return supertest(app)
                    .get(`/api/usersalbums/${userAlbumId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedUserAlbum);
            });
        });
    });

    describe(`DELETE /api/usersalbums/:usersalbums_id`, () => {
        context(`Given no usersalbums`, () => {
            it(`responds with 404 when user album doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/usersalbums/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `User Album doesn't exist` }
                    });
            });
        });

        context(`Given there are user albums`, () => {
            const testArtists = makeArtistsArray();
            const testUsers = makeUsersArray();
            const testAlbums = makeAlbumsArray();
            const testUsersAlbums = makeUsersAlbumsArray();

            beforeEach('insert usersalbums', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('users')
                                    .insert(testUsers)
                                    .then(() => {
                                        return db
                                            .into('usersalbums')
                                            .insert(testUsersAlbums);
                                    });
                            });
                    });
            });

            it(`responds with 204 and removes the user album`, () => {
                const idToRemove = 2;
                const expectedUsersAlbums = testUsersAlbums.filter(ua => ua.usersalbums_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/usersalbums/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/usersalbums`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedUsersAlbums);
                    });
            });
        });
    });
});