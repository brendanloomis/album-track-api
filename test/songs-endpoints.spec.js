const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeArtistsArray } = require('./artists.fixtures');
const { makeAlbumsArray } = require('./albums.fixtures');
const { makeSongsArray, makeMaliciousSong } = require('./songs.fixtures');

describe(`Songs Endpoints`, () => {
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
        const testSongs = makeSongsArray();

        beforeEach('insert songs', () => {
            return db
                .into('artists')
                .insert(testArtists)
                .then(() => {
                    return db
                        .into('albums')
                        .insert(testAlbums)
                        .then(() => {
                            return db
                                .into('songs')
                                .insert(testSongs);
                        });
                });
        });

        it(`responds with 401 Unauthorized for GET /api/songs`, () => {
            return supertest(app)
                .get('/api/songs')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/songs`, () => {
            return supertest(app)
                .post('/api/songs')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/songs/:song_id`, () => {
            const song = testSongs[1];
            return supertest(app)
                .get(`/api/songs/${song.song_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/songs/:song_id`, () => {
            const song = testSongs[1];
            return supertest(app)
                .delete(`/api/songs/${song.song_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/songs/:song_id`, () => {
            const song = testSongs[1];
            return supertest(app)
                .patch(`/api/songs/${song.song_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/songs`, () => {
        context(`Given no songs`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/songs')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are songs in the database`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();
            const testSongs = makeSongsArray();

            beforeEach('insert songs', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('songs')
                                    .insert(testSongs);
                            });
                    });
            });

            it(`responds with 200 and all of the songs`, () => {
                return supertest(app)
                    .get('/api/songs')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testSongs);
            });
        });

        context(`Given an XSS attack song`, () => {
            const { maliciousSong, expectedSong } = makeMaliciousSong();
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();

            beforeEach('insert malicious song', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('songs')
                                    .insert(maliciousSong);
                            });
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get('/api/songs')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].song_name).to.eql(expectedSong.song_name);
                    });
            });
        });
    });
    
    describe('GET /api/songs/:song_id', () => {
        context(`Given no songs`, () => {
            it(`responds 404 when song doesn't exist`, () => {
                const songId = 123456;
                return supertest(app)
                    .get(`/api/songs/${songId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Song doesn't exist` }
                    });
            });
        });

        context(`Given there are songs in the database`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();
            const testSongs = makeSongsArray();

            beforeEach('insert songs', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('songs')
                                    .insert(testSongs);
                            });
                    });
            });

            it(`responds with 200 and the specified song`, () => {
                const songId = 2;
                const expectedSong = testSongs[songId - 1];

                return supertest(app)
                    .get(`/api/songs/${songId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedSong);
            });
        });

        context(`Given an XSS attack song`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();
            const { maliciousSong, expectedSong } = makeMaliciousSong();

            beforeEach('insert malicious song', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('songs')
                                    .insert(maliciousSong);
                            });
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/songs/${maliciousSong.song_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.song_name).to.eql(expectedSong.song_name);
                    });
            });
        });
    });

    describe(`DELETE /api/songs/:song_id`, () => {
        context(`Given no songs`, () => {
            it(`responds with 404 when song doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/songs/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Song doesn't exist` }
                    });
            });
        });

        context(`Given there are songs in the database`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();
            const testSongs = makeSongsArray();

            beforeEach('insert songs', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('songs')
                                    .insert(testSongs);
                            });
                    });
            });

            it(`responds with 204 and removes the song`, () => {
                const idToRemove = 2;
                const expectedSongs = testSongs.filter(s => s.song_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/songs/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('/api/songs')
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedSongs);
                    });
            });
        });
    });

    describe(`POST /api/songs`, () => {
        const testArtists = makeArtistsArray();
        const testAlbums = makeAlbumsArray();

        beforeEach('insert artists and albums', () => {
            return db
                .into('artists')
                .insert(testArtists)
                .then(() => {
                    return db
                        .into('albums')
                        .insert(testAlbums);
                });
        });

        const requiredFields = ['song_name', 'album'];

        requiredFields.forEach(field => {
            const newSong = {
                song_name: 'new song',
                album: 1
            };

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newSong[field];

                return supertest(app)
                    .post('/api/songs')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newSong)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates a song, responding with 201 and the new song`, () => {
            const newSong = {
                song_name: 'test new song',
                album: 1
            };

            return supertest(app)
                .post(`/api/songs`)
                .send(newSong)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.song_name).to.eql(newSong.song_name);
                    expect(res.body.album).to.eql(newSong.album);
                    expect(res.body).to.have.property('song_id');
                    expect(res.headers.location).to.eql(`/api/songs/${res.body.song_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/songs/${postRes.body.song_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousSong, expectedSong } = makeMaliciousSong();

            return supertest(app)
                .post('/api/songs')
                .send(maliciousSong)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.song_name).to.eql(expectedSong.song_name);
                });
        });
    });

    describe(`PATCH /api/songs/:song_id`, () => {
        context(`Given no songs`, () => {
            it(`responds with 404 when song doesn't exist`, () => {
                return supertest(app)
                    .patch(`/api/songs/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Song doesn't exist` }
                    });
            });
        });

        context(`Given there are songs`, () => {
            const testArtists = makeArtistsArray();
            const testAlbums = makeAlbumsArray();
            const testSongs = makeSongsArray();

            beforeEach('insert songs', () => {
                return db
                    .into('artists')
                    .insert(testArtists)
                    .then(() => {
                        return db
                            .into('albums')
                            .insert(testAlbums)
                            .then(() => {
                                return db
                                    .into('songs')
                                    .insert(testSongs);
                            });
                    });
            });

            it(`responds with 204 and updates the song`, () => {
                const idToUpdate = 2;
                const updateSong = {
                    song_name: 'update name',
                    album: 3
                };
                const expectedSong = {
                    ...testSongs[idToUpdate - 1],
                    ...updateSong
                };

                return supertest(app)
                    .patch(`/api/songs/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateSong)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/songs/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedSong)
                    );
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2;
                const updateSong = {
                    song_name: 'updated name'
                };
                const expectedSong = {
                    ...testSongs[idToUpdate - 1],
                    ...updateSong
                };

                return supertest(app)
                    .patch(`/api/songs/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateSong,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/songs/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedSong)
                    );
            });
        });
    });
});