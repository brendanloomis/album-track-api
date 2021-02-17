const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const AlbumsService = require('./albums-service');

const albumsRouter = express.Router();
const jsonParser = express.json();

// serializes album information to protect from xss attacks
const serializeAlbum = album => ({
    album_id: album.album_id,
    album_name: xss(album.album_name),
    genre: xss(album.genre),
    artist: album.artist
});

albumsRouter
    .route('/')
    .get((req, res, next) => {
        AlbumsService.getAllAlbums(
            req.app.get('db')
        )
            .then(albums => {
                res.json(albums.map(serializeAlbum));
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { album_name, genre, artist } = req.body;
        const newAlbum ={ album_name, genre, artist };

        // returns an error if a required key is missing
        for (const [key, value] of Object.entries(newAlbum)) {
            if (value == null) {
                logger.error(`'${key} is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        AlbumsService.insertAlbum(
            req.app.get('db'),
            newAlbum
        )
            .then(album => {
                logger.info(`Album with id ${album.album_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${album.album_id}`))
                    .json(serializeAlbum(album));
            })
            .catch(next);
    });

albumsRouter
    .route('/:album_id')
    .all((req, res, next) => {
        const { album_id } = req.params;

        AlbumsService.getById(
            req.app.get('db'),
            album_id
        )
            .then(album => {
                // return 404 error if album is not found
                if (!album) {
                    logger.error(`Album with id ${album_id} not found`);
                    return res.status(404).json({
                        error: { message: `Album doesn't exist` }
                    });
                }
                res.album = album;
                next();
            })
            .catch(next);
    })
    .get((req, res) => {
        res.json(serializeAlbum(res.album));
    })
    .patch(jsonParser, (req, res, next) => {
        const { album_name, genre, artist } = req.body;
        const albumToUpdate = { album_name, genre, artist };
        const { album_id } = req.params;

        // return an error if body doesn't contain any required fields
        const numberOfValues = Object.values(albumToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain either 'album_name', 'genre', or 'artist'`}
            });
        }

        AlbumsService.updateAlbum(
            req.app.get('db'),
            album_id,
            albumToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = albumsRouter;