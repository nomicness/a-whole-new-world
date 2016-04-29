(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        github = require('../utils/github.js'),
        voteProcessor = require('../command-processors/vote-processor.js'),
        rollProcessor = require('../command-processors/roll-processor.js'),
        joinProcessor = {
            messages: {
                playerCreated: '{login} player has been created!',
                playerAlreadyCreated: '{login} player has already been created!'
            },
            initialPoints: '/roll 1d12 + 12',
            processJoin: function (commentsUrl, userLogin, requestBody) {
                return github.getPlayerData()
                .then(function (playerData) {
                    var activePlayers = playerData.activePlayers;
                    
                    if (_.find(activePlayers, {name: userLogin})) {
                        return github.sendCommentMessage(commentsUrl, stringFormat(joinProcessor.messages.playerAlreadyCreated, {login: userLogin}));
                    }

                    var player = {
                        name: userLogin,
                        points: rollProcessor.sum(joinProcessor.initialPoints, {})
                    };

                    activePlayers.push(player);

                    github.updatePlayerFile(playerData, stringFormat(joinProcessor.messages.playerCreated, {login: userLogin}));

                    return;
                });
            }
        };

    module.exports = joinProcessor;
}());
