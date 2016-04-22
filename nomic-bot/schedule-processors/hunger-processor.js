(function () {
    'use strict';
    var Q = require('q'),
        schedule = require('node-schedule'),
        moment = require('moment-timezone'),
        _ = require('lodash'),
        stringFormat = require('string-format'),
        config = require('../config/server-config.js'),
        logger = require('../utils/logger.js'),
        github = require('../utils/github.js'),
        rollProcessor = require('../command-processors/roll-processor.js'),
        hungerProcessor = {
            job: null,
            jobSchedule: '0 0 15 * * 3',
            farmProduction: '/roll 1d12+12',
            messages: {
                famineTitle: '@{login} feed your population!',
                famine: '@{login}\'s village of {villageName} has famine in their population! \n\n There are {farmCount} farms, which produced enough to feed {production} people this week. An additional {hungerCount} people need food.',
                starvation: '@{login}\'s village, {villageName} had {deathCount} people starve to death.',
                wipeOut: '@{login}\'s village has all starved to death. Their village has been removed, and their points have been reduced to 0.',
                resolved: '@{login} has resolved their villages hungry population.'
            },
            labelTitles: {
                hunger: 'Hunger'
            },
            scheduleJob: function () {
                if (hungerProcessor.job) {
                    hungerProcessor.job.cancel();
                }
                hungerProcessor.job = schedule.scheduleJob(hungerProcessor.jobSchedule, hungerProcessor.processHunger);
                logger.info('Creating Hunger Job. Next Run: ' + hungerProcessor.getNextRun());
            },
            getNextRun: function () {
                if (hungerProcessor.job) {
                    return moment(hungerProcessor.job.pendingInvocations()[0].fireDate).tz(config.timezone).format('M/D/YY HH:mm z');
                }
                return 'NONE';
            },
            createHungerIssue: function (player, production) {
                var message = stringFormat(hungerProcessor.messages.famine, {
                    login: player.name,
                    villageName: player.village.name,
                    farmCount: player.village.farms,
                    production: production,
                    hungerCount: player.village.hunger
                });
                
                logger.log('  - ' + message);
                
                return github.post({
                    endpoint: 'issues',
                    data: {
                        title: stringFormat(hungerProcessor.messages.famineTitle, {login: player.name}),
                        body: message,
                        assignee: player.name,
                        labels: [
                            hungerProcessor.labelTitles.hunger
                        ]
                    }
                }).catch(logger.error);
            },
            closeHungerIssues: function (player) {
                if (_.get(player, 'village.hunger') <= 0) {
                    return github.get({
                        endpoint: 'issues',
                        query: {
                            labels: hungerProcessor.labelTitles.hunger,
                            per_page: 100
                        }
                    }).then(function (issues) {
                        if (!issues || !issues.length) {
                            return;
                        }
                        return Q.all(_.map(issues, function (issue) {
                            if (issue.assignee.login === player.name) {
                                return github.sendCommentMessage(issue.comments_url, stringFormat(hungerProcessor.messages.resolved, {login: player.name}))
                                .then(function () {
                                    return github.patch({
                                        path: issue.url,
                                        data: {
                                            state: 'closed'
                                        }
                                    });
                                });
                            }
                        }));
                    })
                    .catch(logger.error);
                }
                return Q.when();
            },
            reducePopulation: function (player, amount) {
                if (!_.get(player, 'village.population') || !_.isObject(player.village.population)) {
                    return 0;
                }
                if (amount <= player.village.population.general) {
                    player.village.population.general -= amount;
                    return 0;
                }

                amount += player.village.population.general;
                player.village.population.general = 0;

                var keys = _.keys(player.village.population);

                _.each(keys, function (key, index) {
                    if (player.village.population[key] <= 0) {
                        keys.splice(index, 1);
                    }
                });

                _.times(amount, function () {
                    var index = _.random(0, keys.length - 1),
                        key = keys[index];

                    if (!keys.length) {
                        return;
                    }

                    player.village.population[key]--;
                    amount--;
                    if (player.village.population[key] <= 0) {
                        keys.splice(index, 1);
                    }
                });

                return amount;

            },
            processStarvation: function (playerData, player) {
                var populationCount = hungerProcessor.getTotalPopulation(player),
                    deathCount = Math.min(populationCount, player.village.hunger),
                    message = stringFormat(hungerProcessor.messages.starvation, {
                        login: player.name,
                        villageName: player.village.name,
                        deathCount: deathCount
                    });
            
                logger.log('  - ' + message);
                
                hungerProcessor.reducePopulation(player, deathCount);

                player.village.hunger = 0;

                github.updatePlayerFile(playerData, message);
                
                return deathCount;
            },
            processFarmProduction: function (player, farms) {
                var playerFarms = (player && player.village && player.village.farms) || 0,
                    farmCount = _.isNumber(farms) ? farms : playerFarms,
                    production = _.sum(_.times(farmCount, _.partial(rollProcessor.sum, hungerProcessor.farmProduction, {}))),
                    currentHunger = (player && player.village && player.village.hunger) || 0;
                
                logger.log('  - Processing Farm Production for ' + player.name + ': ' + farmCount + ' - ' + production);
                
                if (!player || !player.village) {
                    return 0;
                }
                
                player.village.hunger = currentHunger - production;
                
                return production;
                
            },
            processPlayerHunger: function (playerData, player) {
                if (!player.village) {
                    logger.log('  - ' + player.name + ': NO VILLAGE');
                    return;
                }

                if (!player.village.population) {
                    logger.log('  - ' + player.name + ': NO POPULATION');
                    return;
                }

                if (_.isNumber(player.village.population)) {
                    player.village.population = {
                        general: player.village.population
                    };
                }

                if (player.village.hunger > 0) {
                    hungerProcessor.processStarvation(playerData, player);
                }
                
                if (hungerProcessor.getTotalPopulation(player) === 0) {
                    delete player.village;
                    player.points = 0;
                    github.updatePlayerFile(playerData, stringFormat(hungerProcessor.messages.wipeOut, {
                        login: player.name
                    }));
                    return;
                }

                var production = hungerProcessor.processFarmProduction(player),
                    populationCount = hungerProcessor.getTotalPopulation(player);

                player.village.hunger += populationCount;

                logger.log('  - ' + player.name + ': population - ' + populationCount + ' | hunger: ' + player.village.hunger);

                if (player.village.hunger > 0 ) {
                    hungerProcessor.createHungerIssue(player, production);
                }
            },
            processHunger: function () {
                logger.info('Performing Hunger Process...');
                
                return github.getPlayerData()
                    .then(function (playerData){
                        if (!playerData.activePlayers) {
                            logger.warn('No active players found!');
                            return;
                        }

                        logger.log(' :: ' + playerData.activePlayers.length + ' active players :: ');

                        _.each(playerData.activePlayers, _.partial(hungerProcessor.processPlayerHunger, playerData));

                        return github.updatePlayerFile(playerData, 'Feeding the population.')
                            .finally(function () {
                                logger.info('Finished Hunger Process. Next Hunger Job Scheduled to run at ' + hungerProcessor.getNextRun());
                            });
                    });
            },
            getTotalPopulation: function (player) {
                return _.sum(_.values(_.get(player, 'village.population')));
            }
        };

    module.exports = hungerProcessor;

}());
