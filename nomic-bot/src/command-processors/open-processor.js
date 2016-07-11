import _ from 'lodash';
import stringFormat from 'string-format';
import * as github from '../utils/github.js';
import * as voteProcessor from '../command-processors/vote-processor.js';

export const messages = {
    notOwner: '@{login}, you cannot open a proposal which you did not create.',
    notActive: '@{login}, you cannot open the proposal because you are not an active player.'
};

export const processOpen = function (commentsUrl, userLogin, requestBody) {
    const labelsUrl = requestBody.issue.labels_url;

    if (requestBody.issue.user.login !== userLogin) {
        return github.sendCommentMessage(commentsUrl, stringFormat(messages.notOwner, {login: userLogin}));
    }
    
    return github.getPlayerData()
    .then(function (playerData) {
          const activePlayers = playerData.activePlayers;
          
        if (!_.find(activePlayers, {name: userLogin})) {
            return github.sendCommentMessage(commentsUrl, stringFormat(messages.notActive, {login: userLogin}));
        }

        return github.addIssueLabels(labelsUrl, [voteProcessor.labelTitles.open]);
    });
};