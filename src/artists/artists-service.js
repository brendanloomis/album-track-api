const ArtistsService = {
    getAllArtists(knex) {
        return knex.select('*').from('artists');
    },

    insertArtist(knex, newArtist) {
        return knex
            .insert(newArtist)
            .into('artists')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, artist_id) {
        return knex
            .from('artists')
            .select('*')
            .where('artist_id', artist_id)
            .first();
    },

    deleteArtist(knex, artist_id) {
        return knex('artists')
            .where({ artist_id })
            .delete();
    },

    updateArtist(knex, artist_id, newArtistFields) {
        return knex('artists')
            .where({ artist_id })
            .update(newArtistFields);
    }
};

module.exports = ArtistsService;