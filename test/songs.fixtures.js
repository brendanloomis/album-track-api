function makeSongsArray() {
    return [
        {
            song_id: 1,
            song_name: 'First song',
            album: 1
        },
        {
            song_id: 2,
            song_name: 'Another song',
            album: 1
        },
        {
            song_id: 3,
            song_name: 'Woo',
            album: 2
        },
        {
            song_id: 4,
            song_name: 'Hello',
            album: 2
        },
        {
            song_id: 5,
            song_name: 'wow',
            album: 3
        },
        {
            song_id: 6,
            song_name: 'oh',
            album: 3
        },
        {
            song_id: 7,
            song_name: 'ouch',
            album: 4
        },
        {
            song_id: 8,
            song_name: 'what',
            album: 5
        },
        {
            song_id: 9,
            song_name: 'who are you',
            album: 6
        }
    ];
}

function makeMaliciousSong() {
    const maliciousSong = {
        song_id: 911,
        song_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        album: 1
    };

    const expectedSong = {
        ...maliciousSong,
        song_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    };

    return {
        maliciousSong,
        expectedSong
    };
};

module.exports = {
    makeSongsArray,
    makeMaliciousSong
};