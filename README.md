# Album Track API
https://album-track.vercel.app/

API for the Album Track.

## Client Repo
https://github.com/brendanloomis/album-track/

## API Endpoints
### API URL
https://album-track-api.herokuapp.com/api

### GET
* '/artists' get all artists
* '/artists/:artist_id' get a specific artist
* '/albums' get all albums
* '/albums/:album_id' get a specific album
* '/songs' get all songs
* '/songs/:song_id' get a specific song
* '/users/usernames' get all usernames
* '/usersalbums' Parameter: userId (number). Get all albums for a specific user
* '/usersartists' Parameter: userId (number). Get all artists for a specific user

### POST 
* '/users' adds a user
* '/users/login' used for loggin in
* '/artists' adds an artist
* '/albums' adds an album
* '/songs' adds a song
* '/usersalbums' adds a user album
* '/usersartists' adds a user artist

### DELETE
* '/usersalbums/:usersalbums_id' deletes a user album
* '/usersartists/:usersartists_id' deletes a user artist
* '/songs/:song_id' deletes a song

### PATCH
* '/artists/:artist_id' updates an artist
* '/albums/:album_id' updates an album
* '/songs/:song_id' updates a song

## Summary 

![landing](images/landing.png)

Album Track is an application that can be used for music collectors to keep track of the albums that they own. Users can add artists, albums, and songs to their collection. Users can also edit information for the artists, albums, and songs, and delete them from their collection. There is a demo account to try the app out (username: demo, password: password123).

## Technology Used
* Front-End: 
    * React
    * JavaScript
    * HTML
    * CSS
    * Jest
    * Deployed with Vercel

* Back-End:
    * Node
    * Express
    * PostgreSQL
    * Mocha
    * Chai
    * Supertest
    * Deployed with Heroku