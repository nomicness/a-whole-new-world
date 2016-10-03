import _ from 'lodash';
import stringFormat from 'string-format';
import * as github from '../utils/github.js';
import * as  voteProcessor from '../command-processors/vote-processor.js';
import * as rollProcessor from '../command-processors/roll-processor.js';

export const messages = {
    playerCreated: '{login} player has been created!',
    playerAlreadyCreated: '{login} player has already been created!'
};

export const initialPoints = '/roll 1d12 + 12';

export const processJoin = function (commentsUrl, userLogin, requestBody) {
    return github.getPlayerData()
    .then(function (playerData) {
        const activePlayers = playerData.activePlayers;
        
        if (_.find(activePlayers, {name: userLogin})) {
            return github.sendCommentMessage(commentsUrl, stringFormat(messages.playerAlreadyCreated, {login: userLogin}));
        }

        const player = {
            name: userLogin,
            points: rollProcessor.sum(initialPoints, {})
        };

        activePlayers.push(player);

        github.updatePlayerFile(playerData, stringFormat(messages.playerCreated, {login: userLogin}));

        return;
    });
};
