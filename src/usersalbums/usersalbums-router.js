const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const UsersAlbumsService = require('./usersalbums-service');

const usersAlbumsRouter = express.Router();
const jsonParser = express.json();

const serializeUserAlbum = userAlbum => ({
    usersalbums_id: userAlbum.usersalbums_id,
    album: userAlbum.album,
    album_name: xss(userAlbum.album_name),
    genre: xss(userAlbum.genre),
    artist: userAlbum.artist,
});

usersAlbumsRouter
    .route('/')
    .get((req, res, next) => {
        const { userId } = req.query;

        if(!userId) {
            logger.error(`userId query is required`);
            return res.status(400).json({
                error: {
                    message: `Query must contain 'userId'`
                }
            });
        }

        UsersAlbumsService.getUsersAlbums(
            req.app.get('db'),
            userId
        )
            .then(albums => {
                res.json(albums.map(serializeUserAlbum));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { user_id, album } = req.body;
        const newUserAlbum = { user_id, album };

        for (const [key, value] of Object.entries(newUserAlbum)) {
            if(value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        UsersAlbumsService.insertUserAlbum(
            req.app.get('db'),
            newUserAlbum
        )
            .then(userAlbum => {
                logger.info(`User Album with id ${userAlbum.usersalbums_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${userAlbum.usersalbums_id}`))
                    .json(userAlbum);
            })
            .catch(next);
    });

usersAlbumsRouter
    .route('/:usersalbums_id')
    .all((req, res, next) => {
        const { usersalbums_id } = req.params;

        UsersAlbumsService.getById(
            req.app.get('db'),
            usersalbums_id
        )
            .then(userAlbum => {
                if(!userAlbum) {
                    logger.error(`User Album with id ${usersalbums_id} not found.`);
                    return res.status(404).json({
                        error: { message: `User Album doesn't exist`}
                    });
                }
                res.userAlbum = userAlbum;
                next();
            })
            .catch(next);
    })
    .get((req, res) => {
        res.json(res.userAlbum);
    })
    .delete((req, res, next) => {
        const { usersalbums_id } = req.params;
        
        UsersAlbumsService.deleteUserAlbum(
            req.app.get('db'),
            usersalbums_id
        )
            .then(() => {
                logger.info(`User Album with id ${usersalbums_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = usersAlbumsRouter;