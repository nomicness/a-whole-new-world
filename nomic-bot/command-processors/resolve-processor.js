(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        github = require('../utils/github.js'),
        logger = require('../utils/logger.js'),
        voteProcessor = require('../command-processors/vote-processor.js'),
        resolveProcessor = {
            messages: {
                notOwner: '@{login}, you cannot resolve a proposal which you did not create.',
                notActive: '@{login}, you cannot resolve the proposal because you are not an active player.',
                noQuorum: '@{login}, the proposal does not currently have a quorum and cannot be resolved. To force the proposal to close, use the **/close** command.',
                tiedVote: '@{login}, the proposal is currently tied and cannot be accepted or rejected. If you wish to close the proposal, use the **/close** command.',
                mergeProblem: '@{login}, there was a problem performing the PR merge. Good luck on your journey. \n\n The error message was: {message}',
                pointValue: '@{login} has earned {value} points for the passing of {ordinal} (PR #{issueNumber})' 
            },
            hasQuorum: function (issue) {
                return !!_.find(issue.labels, {name: voteProcessor.labelTitles.quorum});
            },
            isPassing: function (issue) {
                return !!_.find(issue.labels, {name: voteProcessor.labelTitles.passing});
            },
            isFailing: function (issue) {
                return !!_.find(issue.labels, {name: voteProcessor.labelTitles.failing});
            },
            isTied: function (issue) {
                return !!_.find(issue.lables, {name: voteProcessor.labelTitles.tied});
            },
            processReject: function (issue) {
                var labels = _.map(_.remove(issue.labels, {name: voteProcessor.labelTitles.open}), 'name');
                logger.log('  - Closing PR #' + issue.number);
                return github.patch({
                    path: issue.url,
                    data: {
                        state: 'closed',
                        labels: labels
                    }
                }).catch(logger.error);
            },
            processAccept: function (issue, userLogin) {
                
                logger.log('  - Removing "' + voteProcessor.labelTitles.open + '" label');
                
                return github.removeIssueLabel(issue.labels_url, voteProcessor.labelTitles.open)
                .then(function () {
                    logger.log('  - Getting full PR');
                    return github.get({
                        path: issue.pull_request.url
                    }).then(function (pullRequest) {
                        logger.log('  - Attempting to merge PR');
                        return github.put({
                            path: pullRequest.url + '/merge',
                            data: {
                                commit_title: 'Resolving Proposal',
                                commit_message: 'Resolving Proposal for @' + userLogin,
                                sha: pullRequest.head.sha
                            }
                        })
                        .then(function () {
                            logger.log('  - Setting closed state for issue');
                            return github.patch({
                                path: issue.url,
                                data: {
                                    state: 'closed'
                                }
                            });
                        });
                    });
                });
            },
            processPoints: function (playerData, player, issue) {
                var ordinal = Number(voteProcessor.expressions.ordinal.exec(issue.title)[1]),
                    value = ordinal - 291,
                    message = stringFormat(resolveProcessor.messages.pointValue, {login: player.name, ordinal: ordinal, issueNumber: issue.number, value: value});
                
                logger.log('  - ' + player.name + ' has earned ' + value + ' points');
                
                player.points = Number(player.points) + value;
                
                return github.updatePlayerFile(playerData, message)
                    .then(function () {
                        return github.sendCommentMessage(issue.comments_url, message);
                    });
            },
            processResolve: function (commentsUrl, userLogin, requestBody) {
                var issue = requestBody.issue;
                
                if (issue.user.login !== userLogin) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(resolveProcessor.messages.notOwner, {login: userLogin}));
                }
                
                if (!resolveProcessor.hasQuorum(issue)) {
                    return github.sendCommentMessage(commentsUrl, stringFormat(resolveProcessor.messages.noQuorum, {login: userLogin}));
                }
                
                return github.getPlayerData()
                .then(function (playerData) {
                    
                    logger.info('Processing Resolution');
                    
                    var activePlayers = playerData.activePlayers,
                        player = _.find(activePlayers, {name: userLogin});
                      
                    if (!player) {
                        logger.log('  - Not an active player');
                        return github.sendCommentMessage(commentsUrl, stringFormat(resolveProcessor.messages.notActive, {login: userLogin}));
                    }
                    
                    if (resolveProcessor.isTied(issue)) {
                        logger.log('  - Issue is tied');
                        return github.sendCommentMessage(commentsUrl, stringFormat(resolveProcessor.messages.tiedVote, {login: userLogin}));
                    }
                       
                    if (resolveProcessor.isPassing(issue)) {
                        logger.log('  - Issue is passing');
                        return resolveProcessor.processAccept(issue, userLogin)
                            .then(_.partial(resolveProcessor.processPoints, playerData, player, issue))
                            .catch(function (error) {
                                return github.sendCommentMessage(issue.comments_url, stringFormat(resolveProcessor.messages.mergeProblem, {login: userLogin, message:error.message}));
                            });
                    }
                    
                    logger.log('  - Issue is failing');
                    
                    return resolveProcessor.processReject(issue);
                     
                 });
            }
        };

    module.exports = resolveProcessor;
}());