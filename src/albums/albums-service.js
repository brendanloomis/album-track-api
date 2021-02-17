const AlbumsService = {
    getAllAlbums(knex) {
        return knex.select('*').from('albums');
    },

    insertAlbum(knex, newAlbum) {
        return knex
            .insert(newAlbum)
            .into('albums')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, album_id) {
        return knex
            .from('albums')
            .select('*')
            .where('album_id', album_id)
            .first();
    },

    updateAlbum(knex, album_id, newAlbumFields) {
        return knex('albums')
            .where({ album_id })
            .update(newAlbumFields);
    }
};

module.exports = AlbumsService;