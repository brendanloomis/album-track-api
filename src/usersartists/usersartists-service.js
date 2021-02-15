const UsersArtistsService = {
    getUsersArtists(knex, user_id) {
        return knex
            .select('usersartists_id', 'artist_id', 'artist_name')
            .from('usersartists')
            .innerJoin('artists', 'artists.artist_id', 'usersartists.artist')
            .where('user_id', user_id)
    },

    insertUserArtist(knex, newUserArtist) {
        return knex
            .insert(newUserArtist)
            .into('usersartists')
            .returning('*')
            .then(rows => {
                return rows[0]
            });
    },

    getById(knex, usersartists_id) {
        return knex
            .from('usersartists')
            .select('*')
            .where('usersartists_id', usersartists_id)
            .first();
    },

    deleteUserArtist(knex, usersartists_id) {
        return knex('usersartists')
            .where({ usersartists_id })
            .delete();
    }
};

module.exports = UsersArtistsService;