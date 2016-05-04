(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        github = require('../utils/github.js'),
        hungerProcessor = require('../schedule-processors/hunger-processor.js'),
        buyProcessor = {
            costs: {
                farm: 10,
                sawmill: 100
            },
            expressions: {
               farm: /\/buy\s*([0-9]*)\s*farm[s]?\s*$/i,
               sawmill: /\/buy\s*([0-9]*)\s*sawmill[s]?\s*$/i
            },
            messages: {
                invalid: 'I\'m sorry @{login}, the request entered did not match any of my logic circuits for purchases. Please try something which matches one of the following:\n\n```javascript\n{expressions}```',
                notActive: '@{login}, you are not an active player and cannot purchase anything.',
                noVillage: '@{login}, you do not have a village and cannot purchase anything.',
                nsf: '@{login}, you do not have enough points to purchase {count} {item}(s). You have {balance} points and need {cost} points.',
                farm: '@{login} purchased {count} farm(s) for {cost} points, which produced enough food to feed {production} people.',
                sawmill: '@{login} purchased {count} sawmill(s) for {cost} points, which produced {production} lumber.'

            },
            processBuy: function (commentsUrl, userLogin, requestBody) {
                var comment = requestBody.comment.body,
                    result;
                
                _.each(buyProcessor.expressions, function (expression, methodName) {
                    if (expression.test(comment)) {
                        result = github.getPlayerData()
                            .then(function (playerData) {
                                var player = _.find(playerData.activePlayers, {name: userLogin});

                                if (!player) {
                                    return github.sendCommentMessage(commentsUrl, stringFormat(buyProcessor.messages.notActive, {login: userLogin}));
                                }

                                if (!player.village) {
                                    return github.sendCommentMessage(commentsUrl, stringFormat(buyProcessor.messages.noVillage, {login: userLogin}));
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
            sawmill: function (commentsUrl, requestBody, playerData, player) {
                var purchaseInstruction = buyProcessor.expressions.sawmill.exec(requestBody.comment.body),
                    count = Number(purchaseInstruction[1]) || 1,
                    pointCost = count * buyProcessor.costs.sawmill,
                    production = 0,
                    message = '';

                if (player.points < pointCost) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(buyProcessor.messages.nsf, {
                        login: player.name,
                        count: count,
                        item: 'sawmill',
                        balance: player.points,
                        cost: pointCost
                    }));
                }

                player.points -= pointCost;
                player.village.sawmills = (player.village.sawmills || 0) + count;
                message = stringFormat(buyProcessor.messages.sawmill, {
                    login: player.name,
                    count: count,
                    cost: pointCost,
                    production: production
                });

                github.sendCommentMessage(commentsUrl, message);

                return hungerProcessor.closeHungerIssues(player)
                .then(function () {
                    return github.updatePlayerFile(playerData, message);
                });
            },
            farm: function (commentsUrl, requestBody, playerData, player) {
                var purchaseInstruction = buyProcessor.expressions.farm.exec(requestBody.comment.body),
                    farmCount = Number(purchaseInstruction[1]) || 1,
                    pointCost = farmCount * buyProcessor.costs.farm,
                    production = 0,
                    message = '';
            
                if (player.points < pointCost) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(buyProcessor.messages.nsf, {
                        login: player.name,
                        count: farmCount,
                        item: 'farm',
                        balance: player.points,
                        cost: pointCost
                    }));
                }
                
                production = hungerProcessor.processFarmProduction(player, farmCount);
                player.points -= pointCost;
                player.village.farms += farmCount;
                message = stringFormat(buyProcessor.messages.farm, {
                    login: player.name,
                    count: farmCount,
                    cost: pointCost,
                    production: production
                });
                
                github.sendCommentMessage(commentsUrl, message);
                
                return hungerProcessor.closeHungerIssues(player)
                .then(function () {
                    return github.updatePlayerFile(playerData, message);
                });
            }
        };
        
    function sendInvalidCommand(url, userLogin) {
        var expressions = '';
        _.each(buyProcessor.expressions, function (value) {
            expressions += value.toString() + '\n\n';
        });

        return github.sendCommentMessage(url, stringFormat(buyProcessor.messages.invalid, {
            login: userLogin,
            expressions: expressions
        }));
    }
    
    module.exports = buyProcessor;

}());
