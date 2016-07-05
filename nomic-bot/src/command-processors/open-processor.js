(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        github = require('../utils/github.js'),
        voteProcessor = require('../command-processors/vote-processor.js'),
        openProcessor = {
            messages: {
                notOwner: '@{login}, you cannot open a proposal which you did not create.',
                notActive: '@{login}, you cannot open the proposal because you are not an active player.'
            },
            processOpen: function (commentsUrl, userLogin, requestBody) {
                var labelsUrl = requestBody.issue.labels_url;

                if (requestBody.issue.user.login !== userLogin) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(openProcessor.messages.notOwner, {login: userLogin}));
                }
                
                return github.getPlayerData()
                .then(function (playerData) {
                      var activePlayers = playerData.activePlayers;
                      
                    if (!_.find(activePlayers, {name: userLogin})) {
                        return github.sendCommentMessage(commentsUrl, stringFormat(openProcessor.messages.notActive, {login: userLogin}));
                    }

                    return github.addIssueLabels(labelsUrl, [voteProcessor.labelTitles.open]);
                });
            }
        };

    module.exports = openProcessor;
}());