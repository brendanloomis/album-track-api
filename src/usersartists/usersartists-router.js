const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const UsersArtistsService = require('./usersartists-service');

const usersArtistsRouter = express.Router();
const jsonParser = express.json();

// serializes user artist information to protect from xss attacks
const serializeUserArtist = userArtist => ({
    usersartists_id: userArtist.usersartists_id,
    user_id: userArtist.user_id,
    artist_id: userArtist.artist_id,
    artist_name: xss(userArtist.artist_name)
});

usersArtistsRouter
    .route('/')
    .get((req, res, next) => {
        // get user id from the query
        const { userId } = req.query;

        // return an error if the user id isn't supplied
        if(!userId) {
            logger.error(`userId query is required`);
            return res.status(400).json({
                error: {
                    message: `Query must contain 'userId'`
                }
            });
        }

        // return the user's artists based on the user id
        UsersArtistsService.getUsersArtists(
            req.app.get('db'),
            userId
        )
            .then(artists => {
                res.json(artists.map(serializeUserArtist));
            })  
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { user_id, artist } = req.body;
        const newUserArtist = { user_id, artist };

        // return an error if the required fields aren't in the request body
        for (const [key, value] of Object.entries(newUserArtist)) {
            if(value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        UsersArtistsService.insertUserArtist(
            req.app.get('db'),
            newUserArtist
        )
            .then(userArtist => {
                logger.info(`User Artist with id ${userArtist.usersartists_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${userArtist.usersartists_id}`))
                    .json(userArtist);
            })
            .catch(next);
    });

usersArtistsRouter
    .route('/:usersartists_id')
    .all((req, res, next) => {
        const { usersartists_id } = req.params;

        UsersArtistsService.getById(
            req.app.get('db'),
            usersartists_id
        )
            .then(userArtist => {
                // return an error if the user artist doesn't exist
                if(!userArtist) {
                    logger.error(`User Artist with id ${usersartists_id} not found.`);
                    return res.status(404).json({
                        error: { message: `User Artist doesn't exist`}
                    });
                }
                res.userArtist = userArtist;
                next();
            })
            .catch(next);
    })
    .delete((req, res, next) => {
        const { usersartists_id } = req.params;
        
        UsersArtistsService.deleteUserArtist(
            req.app.get('db'),
            usersartists_id
        )
            .then(() => {
                logger.info(`User Artist with id ${usersartists_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = usersArtistsRouter;