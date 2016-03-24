(function () {
    'use strict';
    var _ = require('lodash'),
        YAML = require('yamljs'),
        github = require('../github/github.js'),
        expressions = {
            vote: /^yay|nay$/i,
            positive: /^\s*yay\s*$/i,
            negative: /^\s*nay\s*$/i
        },
        labelTitles = {
            passing: 'Passing',
            failing: 'Failing',
            tied: 'Tied',
            open: 'Open For Voting',
            quorum: 'Has Quorum'
        },
        voteProcessor = {
            processVote: function (commentsUrl, userLogin, requestBody) {
                var labelsUrl = requestBody.issue.labels_url,
                    currentLabels = requestBody.issue.labels;

                if (!_.find(currentLabels, {name: labelTitles.open})) {
                    return github.sendCommentMessage(commentsUrl, '@' + userLogin + ', this proposal is not open for voting, your vote will not be counted.');
                }

                github.get({
                    path: commentsUrl
                }).then(function (comments) {
                    github.getFileContents({
                        endpoint: 'contents/players.yaml'
                    }).then(function (playerContent) {
                        var activePlayers = YAML.parse(playerContent).activePlayers,
                            votes = [],
                            hasQuorum = false,
                            voteValue = 0,
                            labels = [labelTitles.open],
                            quorum = Math.ceil(activePlayers.length * 0.5);

                        _.each(comments, function (comment) {
                            var userLogin = comment.user.login,
                                isVote = expressions.vote.test(comment.body),
                                activePlayer = _.find(activePlayers, {name: userLogin}),
                                hasVoted = _.find(votes, {login: userLogin}),
                                vote = {
                                    login: userLogin,
                                    value: expressions.positive.test(comment.body) ? 1 : -1
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
                            _.each(labelTitles, function (labelValue) {

                                if (labelInfo.name !== labelValue) {
                                    found = true;
                                }
                            });

                            if (!found) {
                                labels.push(labelInfo.name);
                            }
                        });

                        _.each(votes, function (vote) {
                            console.log(' ' + vote.login + ': ' + vote.value);
                            voteValue += vote.value;
                        });

                        hasQuorum = _.size(votes) >= quorum;
                        
                        if (hasQuorum) {
                            labels.push(labelTitles.quorum);
                        }

                        if (voteValue > 0) {
                            labels.push(labelTitles.passing);
                        } else if (voteValue < 0) {
                            labels.push(labelTitles.failing);
                        } else {
                            labels.push(labelTitles.tied);
                        }
                        console.log(labels);

                        console.log(' ' + _.size(votes) + ' / ' + quorum + ' (total: ' + activePlayers.length + '): [' + voteValue + ']');

                        github.setIssueLabels(labelsUrl, labels);

                    }).catch(function (error) {
                        console.error(error);
                    });
                }).catch(function (error) {
                    console.error(error);
                });
            }
        };

    module.exports = voteProcessor;
}());
