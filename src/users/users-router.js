const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const UsersService = require('./users-service');

const usersRouter = express.Router();
const jsonParser = express.json();

const serializeUser = user => ({
    user_id: user.user_id,
    first_name: xss(user.first_name),
    last_name: xss(user.last_name),
    username: xss(user.username),
    password: xss(user.password)
});

const serializeUsername = user => ({
    username: xss(user.username)
});

usersRouter
    .route('/')
    .get((req, res, next) => {
        UsersService.getAllUsers(
            req.app.get('db')
        )
            .then(users => {
                res.json(users.map(serializeUser));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { first_name, last_name, username, password } = req.body;
        const newUser = { first_name, last_name, username, password };

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        UsersService.insertUser(
            req.app.get('db'),
            newUser
        )
            .then(user => {
                logger.info(`User with id ${user.user_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.user_id}`))
                    .json(serializeUser(user));
            })
            .catch(next);
    });

usersRouter
    .route('/login')
    .post(jsonParser, (req, res, next) => {
        const { username, password } = req.body;

        if (!username || !password) {
            logger.error(`'username' and 'password' are required`);
            return res.status(400).json({
                error: { message: `Request body must contain 'username' and 'password'`}
            });
        }

        UsersService.getUserByUsername(
            req.app.get('db'),
            username
        )
            .then(user => {
                if (!user) {
                    logger.error(`User not found.`);
                    return res.status(404).json({
                        error: { message: `User doesn't exist`}
                    });
                }
        
                if (user.password !== password) {
                    logger.error(`Incorrect password`);
                    return res.status(401).json({
                        error: { message: `Incorrect password` }
                    });
                }
        
                const userInfo = {
                    user_id: user.user_id,
                    first_name: xss(user.first_name),
                    last_name: xss(user.last_name),
                    username: xss(user.username)
                };
        
                return res.json(userInfo);
            })
            .catch(next);

    });

usersRouter
    .route('/usernames')
    .get((req, res, next) => {
        UsersService.getAllUsernames(
            req.app.get('db')
        )
            .then(usernames => {
                res.json(usernames.map(serializeUsername));
            })
            .catch(next);
    })

usersRouter
    .route('/:user_id')
    .all((req, res, next) => {
        const { user_id } = req.params;

        UsersService.getById(
            req.app.get('db'),
            user_id
        )
            .then(user => {
                if (!user) {
                    logger.error(`User with id ${user_id} not found.`);
                    return res.status(404)
                        .json({
                            error: { message: `User doesn't exist` }
                        });
                }
                res.user = user;
                next();
            })
            .catch(next);
    })
    .get((req, res) => {
        res.json(serializeUser(res.user));
    })
    .delete((req, res, next) => {
        const { user_id } = req.params;

        UsersService.deleteUser(
            req.app.get('db'),
            user_id
        )
            .then(() => {
                logger.info(`User with id ${user_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { first_name, last_name, username, password } = req.body;
        const userToUpdate = { first_name, last_name, username, password };
        const { user_id } = req.params;

        const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain either 'first_name', 'last_name', 'username', or 'password'`}
            });
        }

        UsersService.updateUser(
            req.app.get('db'),
            user_id,
            userToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = usersRouter;