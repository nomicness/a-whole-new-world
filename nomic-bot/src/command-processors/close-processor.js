(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        github = require('../utils/github.js'),
        logger = require('../utils/logger.js'),
        voteProcessor = require('../command-processors/vote-processor.js'),
        closeProcessor = {
            messages: {
                notOwner: '@{login}, you cannot close a proposal which you did not create.',
                notActive: '@{login}, you cannot close the proposal because you are not an active player.'
            },
            processClose: function (commentsUrl, userLogin, requestBody) {
                var issue = requestBody.issue;

                if (issue.user.login !== userLogin) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(closeProcessor.messages.notOwner, {login: userLogin}));
                }
                
                return github.getPlayerData()
                .then(function (playerData) {
                    var activePlayers = playerData.activePlayers,
                        labels = _.map(_.remove(issue.labels, {name: voteProcessor.labelTitles.open}), 'name');
                      
                    if (!_.find(activePlayers, {name: userLogin})) {
                        return github.sendCommentMessage(commentsUrl, stringFormat(closeProcessor.messages.notActive, {login: userLogin}));
                    }
                    
                    return github.patch({
                        path: issue.url,
                        data: {
                            state: 'closed',
                            labels: labels
                        }
                    }).catch(logger.error);
                });
            }
        };

    module.exports = closeProcessor;
}());