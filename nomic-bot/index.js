(function () {
    'use strict';

    var serverConfig = require('./config/server-config.js'),
        ApiServer = require('./api-server.js'),
        CommentProcessor = require('./comment/comment-processor.js'),
        apiServer = new ApiServer(serverConfig),
        commentProcessor = new CommentProcessor(apiServer);

}());
