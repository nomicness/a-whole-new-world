import _ from 'lodash';
import stringFormat from 'string-format';
import github from '../utils/github.js';
import voteProcessor from '../command-processors/vote-processor.js';
import rollProcessor from '../command-processors/roll-processor.js';

const joinProcessor = {
    messages: {
        playerCreated: '{login} player has been created!',
        playerAlreadyCreated: '{login} player has already been created!'
    },
    initialPoints: '/roll 1d12 + 12',
    processJoin: function (commentsUrl, userLogin, requestBody) {
        return github.getPlayerData()
        .then(function (playerData) {
            const activePlayers = playerData.activePlayers;
            
            if (_.find(activePlayers, {name: userLogin})) {
                return github.sendCommentMessage(commentsUrl, stringFormat(joinProcessor.messages.playerAlreadyCreated, {login: userLogin}));
            }

            const player = {
                name: userLogin,
                points: rollProcessor.sum(joinProcessor.initialPoints, {})
            };

            activePlayers.push(player);

            github.updatePlayerFile(playerData, stringFormat(joinProcessor.messages.playerCreated, {login: userLogin}));

            return;
        });
    }
};

export default joinProcessor;
