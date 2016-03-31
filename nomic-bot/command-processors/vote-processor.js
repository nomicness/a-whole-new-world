(function () {
    'use strict';
    var _ = require('lodash'),
        logger = require('../utils/logger.js'),
        github = require('../utils/github.js'),
        voteProcessor = {
            labelTitles: {
                passing: 'Passing',
                failing: 'Failing',
                tied: 'Tied',
                open: 'Open For Voting',
                quorum: 'Has Quorum'
            },
            expressions: {
                vote: /^yay|nay$/i,
                positive: /^\s*yay\s*$/i,
                negative: /^\s*nay\s*$/i
            },
            processVote: function (commentsUrl, userLogin, requestBody) {
                var labelsUrl = requestBody.issue.labels_url,
                    currentLabels = requestBody.issue.labels;

                if (!_.find(currentLabels, {name: voteProcessor.labelTitles.open})) {
                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', this proposal is not open for voting, your vote will not be counted.');
                }

                return github.get({
                    path: commentsUrl
                }).then(function (comments) {
                    return github.getPlayerData()
                        .then(function (playerData) {
                            var activePlayers = playerData.activePlayers,
                                votes = [],
                                hasQuorum = false,
                                voteValue = 0,
                                labels = [voteProcessor.labelTitles.open],
                                quorum = Math.ceil(activePlayers.length * 0.5);

                            _.each(comments, function (comment) {
                                var userLogin = comment.user.login,
                                    isVote = voteProcessor.expressions.vote.test(comment.body),
                                    activePlayer = _.find(activePlayers, {name: userLogin}),
                                    hasVoted = _.find(votes, {login: userLogin}),
                                    vote = {
                                        login: userLogin,
                                        value: voteProcessor.expressions.positive.test(comment.body) ? 1 : -1
                                    };

                                if (hasVoted && isVote) {
                                    _.remove(votes, {login: userLogin});
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

                            _.each(votes, function (vote) {
                                logger.log(' ' + vote.login + ': ' + vote.value);
                                voteValue += vote.value;
                            });

                            hasQuorum = _.size(votes) >= quorum;

                            if (hasQuorum) {
                                labels.push(voteProcessor.labelTitles.quorum);
                            }

                            if (voteValue > 0) {
                                labels.push(voteProcessor.labelTitles.passing);
                            } else if (voteValue < 0) {
                                labels.push(voteProcessor.labelTitles.failing);
                            } else {
                                labels.push(voteProcessor.labelTitles.tied);
                            }
                            logger.log(labels);

                            logger.log(' ' + _.size(votes) + ' / ' + quorum + ' (total: ' + activePlayers.length + '): [' + voteValue + ']');

                            return github.setIssueLabels(labelsUrl, labels);                            
                        });
                }).catch(logger.error);
            }
        };

    module.exports = voteProcessor;
}());
