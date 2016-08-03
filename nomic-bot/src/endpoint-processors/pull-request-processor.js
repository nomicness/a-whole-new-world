import _ from 'lodash';
import * as github from '../utils/github.js';
import * as logger from '../utils/logger.js';
import * as botUpdateProcessor from '../command-processors/bot-update-processor.js';

export const initializeEndpoint = function (apiServer) {
    if (!apiServer) {
        throw new Error('Unable to initialize comment processor endpoint: missing api server');
    }

    apiServer.answerPost('/pull', processPull);
}

export const processPull = function (request, responder) {
    const body = request.body;
    const pr = body.pull_request;
    const action = body.action;
    const merged = pr.merged;
    if (body.action === 'closed' && merged && pr.base.ref === 'master') {
        return processMerge(pr);
    }
    return responder.status(200).json();
}

const processMerge = function (pr) {
    logger.info('Processing PR Merge')
    return github.get({
        endpoint: 'pulls/' + pr.number + '/files'
    }).then(function (files) {
        logger.log('  - ' + pr.title + ': ' + files.length + ' files')
        var hasBot = false;
        _.each(files, function (file) {
            hasBot = hasBot || (/nomic-bot/).test(file.filename);
        });
        if (hasBot) {
            botUpdateProcessor.processUpdate(pr);
        }
    });
}