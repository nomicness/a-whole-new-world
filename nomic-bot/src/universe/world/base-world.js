import { getPlayerData } from '../../utils/github';
import { find } from 'lodash';

export const getComment = ({ request }) => ({
    comment: request.comment.body
});

export const getCommentsUrl = ({ request }) => ({
    commentsUrl: request.issue.comments_url
});

export async function getPlayers() {
    const { activePlayers: players, inactivePlayers } = await getPlayerData()
    return {
        players,
        inactivePlayers,
    }
}

export const getPlayer = ({ request, players }) => ({
    player: find(players, { name: request.comment.user.login })
});