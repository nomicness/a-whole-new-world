import _ from 'lodash';
import { updatePlayerFile } from '../../utils/github'
import { addInterpretation, updatePlayer } from './index';

const commentToMessage = (comment, player) => `${player.name} - ${comment}`

addInterpretation(updatePlayer, ({ player }, { comment, players, inactivePlayers }) => {
    const playerIndex = _.findIndex(players, p => p.name === player.name);
    players[playerIndex] = player;
    return updatePlayerFile({ 
        activePlayers: players, 
        inactivePlayers,
    }, commentToMessage(comment, player))
})
