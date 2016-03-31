(function () {
    'use strict';
    var _ = require('lodash'),
        github = require('../utils/github.js'),
        hungerProcessor = require('../schedule-processors/hunger-processor.js'),
        buyProcessor = {
            costs: {
                farm: 10
            },
            expressions: {
               farm: /\/buy\s*([0-9]*)\s*farm[s]?\s*$/i 
            },
            processBuy: function (commentsUrl, userLogin, requestBody) {
                var comment = requestBody.comment.body,
                    result;
                
                _.each(buyProcessor.expressions, function (expression, methodName) {
                    if (expression.test(comment)) {
                        result = github.getPlayerData()
                            .then(function (playerData) {
                                var player = _.find(playerData.activePlayers, {name: userLogin});
                                
                                if (!playerData.activePlayers) {
                                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', There was a problem in processing your purchase. I am unable to find any active players.');
                                }

                                if (!player) {
                                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', you are not an active player and cannot purchase anything.');
                                }

                                if (!player.village) {
                                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', you do not have a village and cannot purchase anything.');
                                }

                                return buyProcessor[methodName](commentsUrl, requestBody, playerData, player);
                            });
                    }
                });
                
                if (!result) {
                    return sendInvalidCommand(commentsUrl, userLogin);
                }
                
                return result;
            },
            farm: function (commentsUrl, requestBody, playerData, player) {
                var purchaseInstruction = buyProcessor.expressions.farm.exec(requestBody.comment.body),
                    farmCount = purchaseInstruction[1] || 1,
                    pointCost = farmCount * buyProcessor.costs.farm,
                    production = 0,
                    message = '';
            
                if (player.points < pointCost) {
                    return github.sendCommentMessage(commentsUrl, '@' + player.name + ', you do not have enough points to purchase ' + farmCount + ' farm(s). You have ' + player.points + ' points and need ' + pointCost + ' points.');
                }
                
                production = hungerProcessor.processFarmProduction(player, farmCount);
                player.points -= pointCost;
                player.village.farms += farmCount;
                message = '@' + player.name + ' purchased ' + farmCount + ' farm(s) for ' + pointCost + ' points, which produced enough food to feed ' + production + ' people.';
                
                github.sendCommentMessage(commentsUrl, message);
                
                return github.updatePlayerFile(playerData, message);
            }
        };
        
    function sendInvalidCommand(url, userLogin) {
        var message = 'I\'m sorry @' + userLogin + ', the request entered did not match any of my logic circuits for purchases. Please try something which matches one of the following:\n\n```javascript\n';
        _.each(buyProcessor.expressions, function (value) {
            message += value.toString() + '\n\n';
        });
        message += '```';
        return github.sendCommentMessage(url, message);
    }
    
    module.exports = buyProcessor;

}());
