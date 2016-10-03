import _ from 'lodash';
import stringFormat from 'string-format';
import * as github from '../utils/github.js';
import * as logger from '../utils/logger.js';
import * as voteProcessor from '../command-processors/vote-processor.js';

export const messages = {
    notOwner: '@{login}, you cannot close a proposal which you did not create.',
    notActive: '@{login}, you cannot close the proposal because you are not an active player.'
};

export const processClose = function (commentsUrl, userLogin, requestBody) {
    const issue = requestBody.issue;

    if (issue.user.login !== userLogin) {
        return github.sendCommentMessage(commentsUrl, stringFormat(messages.notOwner, {login: userLogin}));
    }
    
    return github.getPlayerData()
    .then(function (playerData) {
        const activePlayers = playerData.activePlayers;
        const labels = _.map(_.remove(issue.labels, {name: voteProcessor.labelTitles.open}), 'name');

        if (!_.find(activePlayers, {name: userLogin})) {
            return github.sendCommentMessage(commentsUrl, stringFormat(messages.notActive, {login: userLogin}));
        }

        return github.patch({
            path: issue.url,
            data: {
                state: 'closed',
                labels: labels
            }
        }).catch(logger.error);
    });
};