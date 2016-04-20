(function () {
    'use strict';
    var _ = require('lodash'),
        stringFormat = require('string-format'),
        logger = require('../utils/logger.js'),
        github = require('../utils/github.js'),
        rollProcessor = require('../command-processors/roll-processor.js'),
        voteProcessor = {
            incentive: '/roll 2d6+1',
            labelTitles: {
                passing: 'Passing',
                failing: 'Failing',
                tied: 'Tied',
                open: 'Open For Voting',
                quorum: 'Has Quorum'
            },
            expressions: {
                vote: /^yay$|^nay$/i,
                ordinal: /^([0-9]+)\s/,
                positive: /^yay$/i,
                negative: /^nay$/i,
                processed: /^@(.*), your vote.* ([0-9]+) points has been added/,
                pending: /^@(.*), your vote.* ([0-9]+) points will be added/
            },
            messages: {
                notOpen: '@{login}, this proposal is not open for voting. Your vote will not be counted.',
                notActive: '@{login}, you are not an active player. Your vote will not be counted.',
                processed: '@{login}, your vote has been processed, a quorum has been reached, and your incentive value of {value} points has been added to your account balance.',
                pending: '@{login}, your vote has been processed and once a quorum is reached, your incentive value of {value} points will be added to your account balance.',
                update: 'Adding voting incentive for {playerTags}for proposal {proposal} (PR #{issueNumber}).'
            },
            processVote: function (commentsUrl, userLogin, requestBody) {
                
                if (!voteProcessor.expressions.ordinal.test(requestBody.issue.title)) {
                    return {message: 'No Ordnial: ' + requestBody.issue.title};
                }
                
                var labelsUrl = requestBody.issue.labels_url,
                    issueTitle = requestBody.issue.title,
                    issueOrdinal = voteProcessor.expressions.ordinal.exec(issueTitle)[1],
                    issueNumber = requestBody.issue.number,
                    currentLabels = requestBody.issue.labels;
                    
                logger.info('Processing Vote for ' + userLogin + ' on ' + issueOrdinal);
                
                if (!_.find(currentLabels, {name: voteProcessor.labelTitles.open})) {
                    logger.log('  - Issue is not open for voting');
                    return github.sendCommentMessage(commentsUrl, stringFormat(voteProcessor.messages.notOpen, {login: userLogin}));
                }

                return github.getAllComments(commentsUrl)
                .then(function (comments) {
                    return github.getPlayerData()
                        .then(function (playerData) {
                            var activePlayers = playerData.activePlayers,
                                votes = [],
                                hasQuorum = false,
                                voteValue = 0,
                                labels = [voteProcessor.labelTitles.open],
                                quorum = Math.ceil(activePlayers.length * 0.5),
                                processedUsers = [],
                                pendingUsers = [];
                            
                            if (!_.find(activePlayers, {name: userLogin})) {
                                return github.sendCommentMessage(commentsUrl, stringFormat(voteProcessor.messages.notActive, {login: userLogin}));
                            }

                            _.each(comments, function (comment) {
                                var commentUser = comment.user.login,
                                    isVote = voteProcessor.expressions.vote.test(comment.body),
                                    activePlayer = _.find(activePlayers, {name: commentUser}),
                                    hasVoted = _.find(votes, {login: commentUser}),
                                    processed = voteProcessor.expressions.processed.exec(comment.body),
                                    pending = voteProcessor.expressions.pending.exec(comment.body),
                                    vote = {
                                        login: commentUser,
                                        value: voteProcessor.expressions.positive.test(comment.body) ? 1 : -1
                                    };
                                
                                if (processed && commentUser === github.userLogin) {
                                    
                                    _.remove(pendingUsers, {login: processed[1]});
                                    
                                    processedUsers.push({
                                        login: processed[1],
                                        value: Number(processed[2])
                                    });
                                }
                                
                                if (pending && commentUser === github.userLogin && !_.find(processed, {login: pending[1]})) {
                                    pendingUsers.push({
                                        login: pending[1],
                                        value: Number(pending[2])
                                    });
                                }
                                
                                if (hasVoted && isVote) {
                                    _.remove(votes, {login: commentUser});
                                }

                                if (activePlayer && isVote) {
                                    votes.push(vote);
                                }
                            });

                            _.each(currentLabels, function (labelInfo) {
                                var found = false;
                                _.each(voteProcessor.labelTitles, function (labelValue) {

                                    if (labelInfo.name !== labelValue) {
                                        found = true;
                                    }
                                });

                                if (!found) {
                                    labels.push(labelInfo.name);
                                }
                            });
                            
                            logger.log('  === Counting Votes ===');
                            _.each(votes, function (vote) {
                                logger.log('    - [' + vote.login + ': ' + vote.value + ']');
                                voteValue += vote.value;
                            });
                            logger.log('  === Finished Counting ===');

                            hasQuorum = _.size(votes) >= quorum;
                            
                            if (hasQuorum) {
                                
                                logger.log('  - ' + issueOrdinal + ' has a qurorum');
                                
                                labels.push(voteProcessor.labelTitles.quorum);
                                if (!_.find(processedUsers, {login: userLogin}) && !_.find(pendingUsers, {login: userLogin})) {
                                    pendingUsers.push(voteProcessor.addPending(commentsUrl, userLogin, hasQuorum));
                                }
                                if (pendingUsers.length) {
                                    voteProcessor.processPending(pendingUsers, commentsUrl, issueTitle, issueNumber);
                                }
                            } else if (!_.find(processedUsers, {login: userLogin}) && !_.find(pendingUsers, {login: userLogin})) {
                                voteProcessor.addPending(commentsUrl, userLogin, hasQuorum);
                            }

                            if (voteValue > 0) {
                                labels.push(voteProcessor.labelTitles.passing);
                            } else if (voteValue < 0) {
                                labels.push(voteProcessor.labelTitles.failing);
                            } else {
                                labels.push(voteProcessor.labelTitles.tied);
                            }
                            
                            logger.log('  - Counted ' + _.size(votes));
                            logger.log('  - Needed ' + quorum + ' for quorum');
                            logger.log('  - From a total of ' + activePlayers.length + ' total players');
                            logger.log('  - Current Vote Value is ' + voteValue);
                            logger.log('  - Assigning the following labels:');
                            _.each(labels, function (label) {
                                logger.log('    - ' + label);
                            });
                            
                            return github.setIssueLabels(labelsUrl, labels);                            
                        });
                });
            },
            addPending: function (commentsUrl, userLogin, hasQuorum) {
                var incentiveValue = rollProcessor.sum(voteProcessor.incentive, {}),
                    pending = {
                        login: userLogin,
                        value: incentiveValue
                    };
                if (!hasQuorum) {
                    github.sendCommentMessage(commentsUrl, stringFormat(voteProcessor.messages.pending, pending));
                }
                return pending;
            },
            processPending: function (pendingUsers, commentsUrl, issueTitle, issueNumber) {
                github.getPlayerData()
                .then(function (playerData) {
                    logger.log('  === Processing Pending Vote Incentives ===');
                    
                    var playerTags = '';
                    _.each(pendingUsers, function (pending) {
                        var player = _.find(playerData.activePlayers, {name: pending.login});
                        
                        if (!player) {
                            return;
                        }
                        
                        logger.log('    - ' + player.name + ' currently has ' + player.points + ' adding ' + pending.value + ' points');
                        
                        player.points += pending.value;
                        playerTags += '@' + player.name + ' ';
                        github.sendCommentMessage(commentsUrl, stringFormat(voteProcessor.messages.processed, pending));
                    });
                    github.updatePlayerFile(playerData, stringFormat(voteProcessor.messages.update, {playerTags: playerTags, proposal: issueTitle, issueNumber: issueNumber}))
                    .then(function () {
                        logger.log('  === Finished Pending Vote Incentives ===');
                    });
                });
            }
        };

    module.exports = voteProcessor;
}());
