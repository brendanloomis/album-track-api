module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://brendanloomis@localhost/album-track',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://brendanloomis@localhost/album-track-test',
    //CLIENT_ORIGIN: 'https://album-track.vercel.app/'
};