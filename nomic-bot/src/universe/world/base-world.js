import { getPlayerData } from '../../utils/github';
import { find } from 'lodash';

const labels = {
    passing: 'Passing',
    failing: 'Failing',
    tied: 'Tied',
    open: 'Open For Voting',
    quorum: 'Has Quorum'
};


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

export const getLabels = ({ request }) => ({
    issueLabels: request.issue.labels,
    allLabels: labels,
    labelsUrl: request.issue.labels_url,
})

export const getIssueAuthor = ({ request, players }) => ({
    author: find(players, { name: request.issue.user.login })
})