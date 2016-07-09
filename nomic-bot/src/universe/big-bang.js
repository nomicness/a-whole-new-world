import _ from 'lodash';
import github from '../utils/github';

const { getPlayerData } = github;

// Every one of our commands are going to have the following type signature:
// Command -> World -> {world :: World, actions :: List Action}
// bang is the function that creates our "World"

const findPlayer = (name, players) =>_.find(players, { name })

export async function bang(command, request, fn) {
    const { activePlayers: players, inactivePlayers } = await getPlayerData()
    const player = findPlayer(request.comment.user.login, players);
    const commentsUrl = request.issue.comments_url;
    const comment = request.comment.body;
    
    const world = { 
        player,
        players,
        inactivePlayers,
        commentsUrl,
        comment,
    }
    const actions = fn(command, world)
    return {
        world,
        actions,
    }
}