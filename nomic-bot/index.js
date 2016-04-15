(function () {
    'use strict';

    var testing = process.env.TESTING || false,
        serverConfig = require('./config/server-config.js'),
        ApiServer = require('./utils/api-server.js'),
        logger = require('./utils/logger.js'),
        commentProcessor = require('./endpoint-processors/comment-processor.js'),
        hungerProcessor = require('./schedule-processors/hunger-processor.js'),
        populationGrowthProcessor = require('./schedule-processors/population-growth-processor.js'),
        apiServer = new ApiServer(serverConfig);
    
    if (testing) {
        logger.info('SYSTEM IS IN TESTING MODE!');
    }
    
    commentProcessor.initializeEndpoint(apiServer);
    hungerProcessor.scheduleJob();
    populationGrowthProcessor.scheduleJob();
}());
