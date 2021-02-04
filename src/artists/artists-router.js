const path = require('path');
const express = require('express');
const logger = require('../logger');
const ArtistsService = require('./artists-service');
const xss = require('xss');

const artistsRouter = express.Router();
const jsonParser = express.json();

const serializeArtist = artist => ({
    artist_id: artist.artist_id,
    artist_name: xss(artist.artist_name)
});

artistsRouter
    .route('/')
    .get((req, res, next) => {
        ArtistsService.getAllArtists(
            req.app.get('db')
        )
            .then(artists => {
                res.json(artists.map(serializeArtist));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { artist_name } = req.body;
        const newArtist = { artist_name };

        if (!artist_name) {
            logger.error(`'artist_name' is required`);
            return res.status(400).json({
                error: { message: `Missing 'artist_name' in request body` }
            });
        }

        ArtistsService.insertArtist(
            req.app.get('db'),
            newArtist
        )
            .then(artist => {
                logger.info(`Artist with id ${artist.artist_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${artist.artist_id}`))
                    .json(serializeArtist(artist));
            })
            .catch(next);
    });

artistsRouter
    .route('/:artist_id')
    .all((req, res, next) => {
        const { artist_id } = req.params;

        ArtistsService.getById(
            req.app.get('db'),
            artist_id
        )
            .then(artist => {
                if (!artist) {
                    logger.error(`Artist with id ${artist_id} not found.`);
                    return res.status(404).json({
                        error: { message: `Artist doesn't exist` }
                    });
                }
                res.artist = artist;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeArtist(res.artist));
    })
    .delete((req, res, next) => {
        const { artist_id } = req.params;

        ArtistsService.deleteArtist(
            req.app.get('db'),
            artist_id
        )
            .then(() => {
                logger.info(`Artist with id ${artist_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { artist_name } = req.body;
        const artistToUpdate = { artist_name };
        const { artist_id } = req.params;

        if (!artist_name) {
            logger.error(`Invalid update without required fields.`);
            return res.status(400).json({
                error: { message: `Request body must conatin 'artist_name'` }
            });
        }

        ArtistsService.updateArtist(
            req.app.get('db'),
            artist_id,
            artistToUpdate
        )
            .then(numRowsAffected => {
                logger.info(`Artist with id ${artist_id} updated`);
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = artistsRouter;