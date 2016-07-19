import multi from 'multiple-methods';
import _ from 'lodash';
import { updatePlayerFile, sendCommentMessage } from '../utils/github'
import * as actions from './actions';

// each interpreter has a type signature of:
// Action -> World -> ()

const commentToMessage = (comment, player) => `${player.name} - ${comment}`

const updatePlayer = ({ player }, { comment, players, inactivePlayers }) => {
    const playerIndex = _.findIndex(players, p => p.name === player.name);
    players[playerIndex] = player;
    return updatePlayerFile({ 
        activePlayers: players, 
        inactivePlayers,
    }, commentToMessage(comment, player))
}

const createComment = ({ comment }, { commentsUrl }) => {
    return sendCommentMessage(commentsUrl, comment);
}

export const interpret = multi(action => action.type)
    .method(actions.updatePlayer.type, updatePlayer)
    .method(actions.createComment.type, createComment)
    .defaultMethod(_.noop)

