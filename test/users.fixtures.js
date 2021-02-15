function makeUsersArray() {
    return [
        {
            user_id: 1,
            first_name: 'name',
            last_name: 'last',
            username: 'test',
            password: 'pw123456'
        },
        {
            user_id: 2,
            first_name: 'first',
            last_name: 'wow',
            username: 'love',
            password: 'lovetest123'
        }
    ];
};

function makeUsernamesArray() {
    return [
        {
            username: 'test'
        },
        {
            username: 'love'
        }
    ];
}

function makeMaliciousUser() {
    const maliciousUser = {
        user_id: 911,
        first_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        last_name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        username: 'Naughty naughty very naughty <script>alert("xss");</script>',
        password: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    };

    const expectedUser = {
        ...maliciousUser,
        first_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        last_name: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        username: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        password: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    };

    return {
        maliciousUser,
        expectedUser,
    };
};

module.exports = {
    makeUsersArray,
    makeUsernamesArray,
    makeMaliciousUser
};