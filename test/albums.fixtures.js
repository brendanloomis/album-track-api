function makeAlbumsArray() {
    return [
        {
            album_id: 1,
            album_name: 'My Album',
            genre: 'Pop',
            artist: 1
        },
        {
            album_id: 2,
            album_name: 'My 2nd Album',
            genre: 'Pop',
            artist: 1
        },
        {
            album_id: 3,
            album_name: 'Woooo',
            genre: 'Pop',
            artist: 2
        },
        {
            album_id: 4,
            album_name: 'Hi',
            genre: 'Pop',
            artist: 2
        },
        {
            album_id: 5,
            album_name: 'Also',
            genre: 'Pop',
            artist: 3
        },
        {
            album_id: 6,
            album_name: 'Last',
            genre: 'Pop',
            artist: 3
        }
    ];
};

function makeMaliciousAlbum() {
    const maliciousAlbum = {
        album_id: 911,
        album_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        genre: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        artist: 1
    };

    const expectedAlbum = {
        ...maliciousAlbum,
        album_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        genre: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    };

    return {
        maliciousAlbum,
        expectedAlbum
    };
};

module.exports = {
    makeAlbumsArray,
    makeMaliciousAlbum
};

