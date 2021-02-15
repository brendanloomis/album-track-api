function makeUsersAlbumsArray() {
    return [
        {
            usersalbums_id: 1,
            user_id: 1,
            album: 1
        },
        {
            usersalbums_id: 2,
            user_id: 1,
            album: 2
        },
        {
            usersalbums_id: 3,
            user_id: 2,
            album: 3
        },
        {
            usersalbums_id: 4,
            user_id: 2,
            album: 4
        }
    ];
}

module.exports = {
    makeUsersAlbumsArray
};