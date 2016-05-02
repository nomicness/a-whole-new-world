(function () {
    'use strict';
    var Q = require('q'),
        _ = require('lodash'),
        logger = require('../utils/logger.js'),
        rollProcessor = require('../command-processors/roll-processor.js'),
        voteProcessor = require('../command-processors/vote-processor.js'),
        openProcessor = require('../command-processors/open-processor.js'),
        closeProcessor = require('../command-processors/close-processor.js'),
        buyProcessor = require('../command-processors/buy-processor.js'),
        resolveProcessor = require('../command-processors/resolve-processor.js'),
        joinProcessor = require('../command-processors/join-processor.js'),
        commentProcessor = {
            expressions: {
                roll: /^\/roll/i,
                vote: /^yay$|^nay$/i,
                open: /^\/open/i,
                resolve: /^\/resolve/i,
                close: /^\/close/i,
                buy: /^\/buy/i,
                join: /^\/join/i
            },
            initializeEndpoint: function (apiServer) {
                if (!apiServer) {
                    throw new Error('Unable to initialize comment processor endpoint: missing api server');
                }

                apiServer.answerPost('/comment', commentProcessor.processComment);
            },
            processComment: function (request, responder) {
                if (request.body.action === 'created') {
                    var commentsUrl = request.body.issue.comments_url,
                        userLogin = request.body.comment.user.login,
                        commentBody = request.body.comment.body;

                    if (commentProcessor.expressions.roll.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(rollProcessor.processRoll(commentsUrl, userLogin, commentBody))
                            .then(_.partial(sendResponse, responder));
                    }

                    if (commentProcessor.expressions.vote.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(voteProcessor.processVote(commentsUrl, userLogin, request.body))
                                .then(_.partial(sendResponse, responder));
                    }

                    if (commentProcessor.expressions.open.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(openProcessor.processOpen(commentsUrl, userLogin, request.body))
                            .then(_.partial(sendResponse, responder));
                    }
                    
                    if (commentProcessor.expressions.resolve.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(resolveProcessor.processResolve(commentsUrl, userLogin, request.body))
                            .then(_.partial(sendResponse, responder));
                    }
                    
                    if (commentProcessor.expressions.close.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(closeProcessor.processClose(commentsUrl, userLogin, request.body))
                            .then(_.partial(sendResponse, responder));
                    }

                    if (commentProcessor.expressions.buy.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(buyProcessor.processBuy(commentsUrl, userLogin, request.body))
                            .then(_.partial(sendResponse, responder));
                    }

                    if (commentProcessor.expressions.join.test(commentBody)) {
                        logger.info(userLogin + ' - ' + commentBody);
                        return Q.when(joinProcessor.processJoin(commentsUrl, userLogin, request.body))
                            .then(_.partial(sendResponse, responder));
                    }
                }
                return responder.status(200).json();
            }
        };


    function sendResponse(responder, result) {
        responder.status(200).json(result);
        return result;
    }

    module.exports = commentProcessor;

}());
