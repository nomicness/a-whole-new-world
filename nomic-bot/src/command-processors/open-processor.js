'use strict';
import _ from 'lodash';
import stringFormat from 'string-format';
import github from '../utils/github.js';
import voteProcessor from '../command-processors/vote-processor.js';

const openProcessor = {
    messages: {
        notOwner: '@{login}, you cannot open a proposal which you did not create.',
        notActive: '@{login}, you cannot open the proposal because you are not an active player.'
    },
    processOpen: function (commentsUrl, userLogin, requestBody) {
        const labelsUrl = requestBody.issue.labels_url;

        if (requestBody.issue.user.login !== userLogin) {
            return github.sendCommentMessage(commentsUrl, stringFormat(openProcessor.messages.notOwner, {login: userLogin}));
        }
        
        return github.getPlayerData()
        .then(function (playerData) {
              const activePlayers = playerData.activePlayers;
              
            if (!_.find(activePlayers, {name: userLogin})) {
                return github.sendCommentMessage(commentsUrl, stringFormat(openProcessor.messages.notActive, {login: userLogin}));
            }

            return github.addIssueLabels(labelsUrl, [voteProcessor.labelTitles.open]);
        });
    }
};

export default openProcessor;