function makeArtistsArray() {
    return [
        {
            artist_id: 1,
            artist_name: 'Ariana Grande'
        },
        {
            artist_id: 2,
            artist_name: 'Troye Sivan'
        },
        {
            artist_id: 3,
            artist_name: 'Conan Gray'
        }
    ];
}

function makeMaliciousArtist() {
    const maliciousArtist = {
        artist_id: 911,
        artist_name: 'Naughty naughty very naughty <script>alert("xss");</script>'
    };

    const expectedArtist = {
        ...maliciousArtist,
        artist_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;' 
    };

    return {
        maliciousArtist,
        expectedArtist
    };
}

module.exports = {
    makeArtistsArray,
    makeMaliciousArtist
}