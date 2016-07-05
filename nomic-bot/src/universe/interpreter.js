import multi from 'multiple-methods';
import _ from 'lodash';
import { updatePlayerFile, sendCommentMessage } from '../utils/github'

// each interpreter has a type signature of:
// Action -> World -> ()

const commentToMessage = (comment, player) => `${player.name} - ${comment}`

const updatePlayer = ({ player }, { comment, players }) => {
    const playerIndex = _.findIndex(players, p => p.name === player.name);
    players[playerIndex] = player;
    return updatePlayerFile(players, commentToMessage(comment, player))
}

const createComment = ({ comment }, { commentsUrl }) => {
    return sendCommentMessage(commentsUrl, comment);
}

export const interpret = multi(action => action.type)
    .method('updatePlayer', updatePlayer)
    .method('createComment', createComment)
    .defaultMethod(_.noop)

