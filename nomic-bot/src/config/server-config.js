export default {
    docker: {
        user: process.env.DOCKER_USER,
        password: process.env.DOCKER_PASSWORD
    },
    testing: process.env.TESTING || false,
    protocol: 'http',
    port: process.env.PORT || 80,
    host: process.env.HOST || 'api.nomic.archmageinc.com',
    timezone: 'America/New_York'
};
