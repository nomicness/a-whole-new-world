(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        github = require('../utils/github.js'),
        voteProcessor = require('../command-processors/vote-processor.js'),
        rollProcessor = require('../command-processors/roll-processor.js'),
        joinProcessor = {
            messages: {
                notOwner: '@{login}, you cannot join in an issue you did not create.',
                playerCreated: ''
            },
            initialPoints: '/roll 1d12 + 12',
            processJoin: function (commentsUrl, userLogin, requestBody) {
                var labelsUrl = requestBody.issue.labels_url;

                if (requestBody.issue.user.login !== userLogin) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(joinProcessor.messages.notOwner, {login: userLogin}));
                }
                
                return github.getPlayerData()
                .then(function (playerData) {
                    var activePlayers = playerData.activePlayers;
                    
                    var player = {
                        name: userLogin,
                        points: rollProcessor.sum(joinProcessor.initialPoints, {})
                    };

                    activePlayers.push(player);

                    github.updatePlayerFile(getPlayerData);

                    return github.addIssueLabels(labelsUrl, [voteProcessor.labelTitles.open]);
                });
            }
        };

    module.exports = joinProcessor;
}());
