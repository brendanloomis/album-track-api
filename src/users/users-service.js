const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('users');
    },

    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('users')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, user_id) {
        return knex
            .from('users')
            .select('*')
            .where('user_id', user_id)
            .first();
    },

    deleteUser(knex, user_id) {
        return knex('users')
            .where({ user_id })
            .delete();
    },

    updateUser(knex, user_id, newUserFields) {
        return knex('users')
            .where({ user_id })
            .update(newUserFields);
    },


    getUserByUsername(knex, username) {
        return knex('users')
            .select('*')
            .where('username', username)
            .first();
    },

    getAllUsernames(knex) {
        return knex.select('username').from('users');
    }
};

module.exports = UsersService;