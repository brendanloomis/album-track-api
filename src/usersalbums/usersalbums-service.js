const UsersAlbumsService = {
    getUsersAlbums(knex, user_id) {
        return knex
            .select('usersalbums_id', 'album', 'album_name', 'genre', 'artist')
            .from('usersalbums')
            .innerJoin('albums', 'usersalbums.album', 'albums.album_id')
            .where('user_id', user_id);
    },

    insertUserAlbum(knex, newUserAlbum) {
        return knex
            .insert(newUserAlbum)
            .into('usersalbums')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, usersalbums_id) {
        return knex
            .from('usersalbums')
            .select('*')
            .where('usersalbums_id', usersalbums_id)
            .first();
    },

    deleteUserAlbum(knex, usersalbums_id) {
        return knex('usersalbums')
            .where({ usersalbums_id })
            .delete();
    }
};

module.exports = UsersAlbumsService;