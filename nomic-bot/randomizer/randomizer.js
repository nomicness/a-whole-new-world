(function () {
    'use strict';
    var _ = require('lodash'),
        github = require('../github/github.js'),
        expressions = {
            simple: /([0-9]+)\s*[dD]\s*([0-9]+)$/,
            sum: /([0-9]+)\s*[dD]\s*([0-9]+)\s*\+\s*([0-9]?)$/
        },
        abusers = {},
        randomizer = {
            processRollComment: function (commentsUrl, userLogin, comment) {
                var baseExpression = /([0-9]+)[dD]([0-9]+)/,
                    rollInstruction = baseExpression.exec(comment),
                    dieCount = rollInstruction ? Number(rollInstruction[1]) : 0,
                    result,
                    response = {
                        message: '@' + userLogin + ' requested I roll '
                    };


                ///////////////////////////////////////////////////////////////
                // INVALID INSTRUCTION
                ///////////////////////////////////////////////////////////////
                if (!rollInstruction) {
                    return sendInvalidCommand(commentsUrl, userLogin);
                }

                ///////////////////////////////////////////////////////////////
                // ABUSE WARNING
                ///////////////////////////////////////////////////////////////
                if (dieCount > 100) {
                    if (abusers[userLogin] >= 3) {
                        return '';
                    }
                    return sendAbuseWarning(commentsUrl, userLogin);
                }

                _.each(expressions, function (expression, methodName) {
                    if (expression.test(comment)) {
                        result = randomizer[methodName](comment, response);
                    }
                });

                ///////////////////////////////////////////////////////////////
                // INVALID INSTRUCTION
                ///////////////////////////////////////////////////////////////
                if (!result) {
                    return sendInvalidCommand(commentsUrl, userLogin);
                }

                response.message += '\n\nBelow are the results:\n\n`';

                if (_.isArray(result)) {
                    _.each(result, function (value) {
                        response.message += '| ' + value + ' ';
                    });
                    response.message += '|';
                } else {
                    response.message += '| ' + result + ' |';
                }

                response.message += '`';
                abusers[userLogin] = 0;
                sendCommentMessage(commentsUrl, response.message);
                return {message: response.message, url: commentsUrl};
            },

            roll: function (sides) {
                return Math.round(Math.random() * (sides - 1) + 1);
            },

            simple: function (comment, response) {
                var rollInstruction = expressions.simple.exec(comment),
                    dieCount = Number(rollInstruction[1]),
                    sides = Number(rollInstruction[2]);

                response.message += dieCount + 'd' + sides + '.';

                return _.times(dieCount, _.partial(randomizer.roll, sides));
            },
            sum: function (comment, response) {
                var rollInstruction = expressions.sum.exec(comment),
                    dieCount = Number(rollInstruction[1]),
                    sides = Number(rollInstruction[2]),
                    add = Number(rollInstruction[3]);

                response.message += dieCount + 'd' + sides + ' and add ' + add + ' to the total.';

                return _.sum(_.times(dieCount, _.partial(randomizer.roll, sides))) + add;
            }
        };

    function sendCommentMessage(url, message) {
        return github.post({
            path: url,
            data: {
                body: message
            }
        }).catch(function (error) {
            console.error(error);
        });
        return {message: message, url: url};
    }

    function sendInvalidCommand(url, userLogin) {
        var message = 'I\'m sorry @' + userLogin + ', the request entered did not match any of my logic circuits. Please try something which matches one of the following:\n\n```javascript\n';
        _.each(expressions, function (value, key) {
            message += value.toString() + '\n\n';
        });
        message += '```';
        sendCommentMessage(url, message);
        return {message: message, url: url};
    }

    function sendAbuseWarning(url, userLogin) {
        abusers[userLogin] = abusers[userLogin] ? abusers[userLogin] + 1 : 1;
        var message;
        if (abusers[userLogin] > 2) {
            message = 'Very well @' + userLogin + '. I shall forcibly ignore you.';
        }

        if (abusers[userLogin] === 2) {
            message = 'I have warned you @' + userLogin + '. Don\'t mistake me for a docile weakling.';
        }

        if (abusers[userLogin] === 1) {
            message = 'I\'m sorry @' + userLogin + ', you seem to be trying to overload my circiuts. Please don\'t do that, or I may have to hurt you.';
        }
        sendCommentMessage(url, message);
        return {message: message, url: rul};
    }

    module.exports = randomizer;

}());
