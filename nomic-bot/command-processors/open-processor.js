(function () {
    'use strict';
    var _ = require('lodash'),
        github = require('../utils/github.js'),
        openProcessor = {
            labelTitles: {
                open: 'Open For Voting'
            },
            processOpen: function (commentsUrl, userLogin, requestBody) {
                var labelsUrl = requestBody.issue.labels_url;

                if (requestBody.issue.user.login !== userLogin) {
                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', you cannot open an issue which you did not create.');
                }
                
                return github.getPlayerData()
                .then(function (playerData) {
                      var activePlayers = playerData.activePlayers;
                      
                    if (!_.find(activePlayers, {name: userLogin})) {
                        return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', you cannot open an issue if you are not an active player.');
                    }

                    return github.addIssueLabels(labelsUrl, [openProcessor.labelTitles.open]);
                });
            }
        };

    module.exports = openProcessor;
}());