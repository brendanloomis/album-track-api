const SongsService = {
    getAllSongs(knex) {
        return knex.select('*').from('songs');
    },

    insertSong(knex, newSong) {
        return knex
            .insert(newSong)
            .into('songs')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, song_id) {
        return knex
            .from('songs')
            .select('*')
            .where('song_id', song_id)
            .first();
    },

    deleteSong(knex, song_id) {
        return knex('songs')
            .where({ song_id })
            .delete();
    },

    updateSong(knex, song_id, newSongFields) {
        return knex('songs')
            .where({ song_id })
            .update(newSongFields);
    }
};

module.exports = SongsService;