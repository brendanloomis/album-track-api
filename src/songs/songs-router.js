const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const SongsService = require('./songs-service');

const songsRouter = express.Router();
const jsonParser = express.json();

// serializes song information to protect from xss attacks
const serializeSong = song => ({
    song_id: song.song_id,
    song_name: xss(song.song_name),
    album: song.album
});

songsRouter
    .route('/')
    .get((req, res, next) => {
        SongsService.getAllSongs(
            req.app.get('db')
        )
            .then(songs => {
                res.json(songs.map(serializeSong))
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { song_name, album } = req.body;
        const newSong = { song_name, album };

        // return an error if request doesn't contain the required fields
        for(const [key, value] of Object.entries(newSong)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        SongsService.insertSong(
            req.app.get('db'),
            newSong
        )
            .then(song => {
                logger.info(`Song with id ${song.song_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${song.song_id}`))
                    .json(serializeSong(song));
            })
            .catch(next);
    });

songsRouter
    .route('/:song_id')
    .all((req, res, next) => {
        const { song_id } = req.params;

        SongsService.getById(
            req.app.get('db'),
            song_id
        )
            .then(song => {
                // return 404 error if song doesn't exist
                if (!song) {
                    logger.error(`Song with id ${song_id} not found.`);
                    return res.status(404)
                        .json({
                            error: { message: `Song doesn't exist` }
                        });
                }
                res.song = song;
                next();
            })
            .catch(next);
    })
    .get((req, res) => {
        res.json(serializeSong(res.song));
    })
    .delete((req, res, next) => {
        const { song_id } = req.params;

        SongsService.deleteSong(
            req.app.get('db'),
            song_id
        )
            .then(() => {
                logger.info(`Song with id ${song_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { song_name, album } = req.body;
        const songToUpdate = { song_name, album };
        const { song_id } = req.params;

        // return an error if request body doesn't contain any required fields
        const numberOfValues = Object.values(songToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain either 'song_name' or 'album'` }
            });
        }

        SongsService.updateSong(
            req.app.get('db'),
            song_id,
            songToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = songsRouter;