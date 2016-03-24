(function () {
    'use strict';
    var _ = require('lodash'),
        YAML = require('yamljs'),
        github = require('../github/github.js'),
        labelTitles = {
            open: 'Open For Voting'
        },
        openProcessor = {
            processOpen: function (commentsUrl, userLogin, requestBody) {
                var labelsUrl = requestBody.issue.labels_url;

                if (requestBody.issue.user.login !== userLogin) {
                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', you cannot open an issue which you did not create.');
                }

                github.getFileContents({
                    endpoint: 'contents/players.yaml'
                }).then(function (playerContent) {
                    var activePlayers = YAML.parse(playerContent).activePlayers;

                    if (!_.find(activePlayers, {name: userLogin})) {
                        return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', you cannot open an issue if you are not an active player.');
                    }

                    return github.addIssueLabels(labelsUrl, [labelTitles.open]);
                }).catch(function (error) {
                    console.error(error);
                });
            }
        };

    module.exports = openProcessor;
}());
