import { getPlayerData } from '../utils/github';
import _ from 'lodash';

// Every one of our commands are going to have the following type signature:
// Command -> World -> List Action
// bang is the function that creates our "World"

const findPlayer = (name, players) =>_.find(players, { name })

export async function bang(command, request, fn) {
    const { activePlayers: players, inActivePlayers } = await getPlayerData()
    const player = findPlayer(request.comment.user.login, players);
    const commentsUrl = request.issue.comments_url;
    const comment = request.comment.body;
    
    const world = { 
        player,
        players,
        inActivePlayers,
        commentsUrl,
        comment,
    }
    const actions = fn(command, world)
    return {
        world,
        actions,
    }
}