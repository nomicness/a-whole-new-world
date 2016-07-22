import Q from 'q';
import _ from 'lodash';
import multi from 'multiple-methods';

import * as logger from '../utils/logger.js';
import * as rollProcessor from '../command-processors/roll-processor.js';
import * as voteProcessor from '../command-processors/vote-processor.js';
import * as openProcessor from '../command-processors/open-processor.js';
import * as closeProcessor from '../command-processors/close-processor.js';
import * as buyProcessor from '../command-processors/buy-processor.js';
import * as resolveProcessor from '../command-processors/resolve-processor.js';
import * as joinProcessor from '../command-processors/join-processor.js';
import * as universe from '../universe';


const execCommand = (processorMethod) => (_, { issue, comment, body }) => {
    return Q.when(processorMethod(issue.comments_url, comment.user.login, body)) 
}


const trapUncaughtCommands = request => result => {
    if (result === undefined) {
        return universe.create(request)
    }
    return result
}

const processCommand = multi(([type]) => type)
    .method('/roll', execCommand(rollProcessor.processRoll))
    .method('yay', execCommand(voteProcessor.processVote))
    .method('nay', execCommand(voteProcessor.processVote))
    .method('/resolve', execCommand(resolveProcessor.processResolve))
    .method('/close', execCommand(closeProcessor.processClose))
    .method('/buy', execCommand(buyProcessor.processBuy))
    .method('/join', execCommand(joinProcessor.processJoin))
    .defaultMethod(_ => Q.when(undefined))

const splitCommand = comment => comment.split(' ');


export const initializeEndpoint = function (apiServer) {
    if (!apiServer) {
        throw new Error('Unable to initialize comment processor endpoint: missing api server');
    }

    apiServer.answerPost('/comment', processComment);
}

export const processComment = function (request, responder) {
    const body = request.body;
    const issue = body.issue;
    const comment = body.comment;
    if (body.action === 'created') {
        return processCommand(splitCommand(comment.body), { issue, comment, body })
            .then(trapUncaughtCommands(body))
            .then(_.partial(sendResponse, responder))
            .catch(e => console.warn(e))
    }
    return responder.status(200).json();
}

function sendResponse(responder, result) {
    responder.status(200).json(result);
    return result;
}
