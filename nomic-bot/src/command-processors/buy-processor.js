import _ from 'lodash';
import stringFormat from 'string-format';
import * as github from '../utils/github.js';
import * as hungerProcessor from '../schedule-processors/hunger-processor.js';

export const costs = {
    farm: 10,
    sawmill: 100
};


export const messages = {
    invalid: 'I\'m sorry @{login}, the request entered did not match any of my logic circuits for purchases. Please try something which matches one of the following:\n\n```javascript\n{expressions}```',
    notActive: '@{login}, you are not an active player and cannot purchase anything.',
    noVillage: '@{login}, you do not have a village and cannot purchase anything.',
    nsf: '@{login}, you do not have enough points to purchase {count} {item}(s). You have {balance} points and need {cost} points.',
    farm: '@{login} purchased {count} farm(s) for {cost} points, which produced enough food to feed {production} people.',
    sawmill: '@{login} purchased {count} sawmill(s) for {cost} points, which produced {production} lumber.'

};

export const processBuy = function (commentsUrl, userLogin, requestBody) {
    const comment = requestBody.comment.body;
    let result;

    _.each(expressions, function ({ expression, fn }) {
        if (expression.test(comment)) {
            result = github.getPlayerData()
                .then(function (playerData) {
                    const player = _.find(playerData.activePlayers, {name: userLogin});

                    if (!player) {
                        return github.sendCommentMessage(commentsUrl, stringFormat(messages.notActive, {login: userLogin}));
                    }

                    if (!player.village) {
                        return github.sendCommentMessage(commentsUrl, stringFormat(messages.noVillage, {login: userLogin}));
                    }

                    return fn(commentsUrl, requestBody, playerData, player);
                });
        }
    });

    if (!result) {
        return sendInvalidCommand(commentsUrl, userLogin);
    }

    return result;
};

export const sawmill = function (commentsUrl, requestBody, playerData, player) {
    const purchaseInstruction = sawmillMatcher.expression.exec(requestBody.comment.body);
    const count = Number(purchaseInstruction[1]) || 1;
    const pointCost = count * costs.sawmill;
    const production = 0;
    let message = '';

    if (player.points < pointCost) {
        return github.sendCommentMessage(commentsUrl, stringFormat(messages.nsf, {
            login: player.name,
            count: count,
            item: 'sawmill',
            balance: player.points,
            cost: pointCost
        }));
    }

    player.points -= pointCost;
    player.village.sawmills = (player.village.sawmills || 0) + count;
    message = stringFormat(messages.sawmill, {
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
};

export const farm = function (commentsUrl, requestBody, playerData, player) {
    const purchaseInstruction = farmMatcher.expression.exec(requestBody.comment.body);
    const farmCount = Number(purchaseInstruction[1]) || 1;
    const pointCost = farmCount * costs.farm;
    let production = 0;
    let message = '';

    if (player.points < pointCost) {
        return github.sendCommentMessage(commentsUrl, stringFormat(messages.nsf, {
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
    message = stringFormat(messages.farm, {
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
};

function sendInvalidCommand(url, userLogin) {
    let expressions = '';
    _.each(buyProcessor.expressions, function (value) {
        expressions += value.toString() + '\n\n';
    });

    return github.sendCommentMessage(url, stringFormat(buyProcessor.messages.invalid, {
        login: userLogin,
        expressions: expressions
    }));
}


const farmMatcher = {
    expression: /\/buy\s*([0-9]*)\s*farm[s]?\s*$/i,
    fn: farm,
}

const sawmillMatcher = {
    expression: /\/buy\s*([0-9]*)\s*sawmill[s]?\s*$/i,
    fn: sawmill,
}


export const expressions = [farmMatcher, sawmillMatcher];
