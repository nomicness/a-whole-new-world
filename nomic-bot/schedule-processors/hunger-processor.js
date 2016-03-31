(function () {
    'use strict';
    var schedule = require('node-schedule'),
        moment = require('moment-timezone'),
        _ = require('lodash'),
        config = require('../config/server-config.js'),
        logger = require('../utils/logger.js'),
        github = require('../utils/github.js'),
        rollProcessor = require('../command-processors/roll-processor.js'),
        hungerProcessor = {
            job: null,
            jobSchedule: '0 0 15 * * 1',
            farmProduction: '/roll 1d12+12',
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
                var message = '@' + player.name + '\'s village of ' + player.village.name +' has famine in their population! \n\n There are ' + player.village.farms + ' farms, which produced enough to feed ' + production + ' people this week. An additional ' + player.village.hunger + ' people need food.';
                
                logger.log('  - ' + message);
                
                return github.post({
                    endpoint: 'issues',
                    data: {
                        title: '@' + player.name + ' feed your population!',
                        body: message,
                        assignee: player.name,
                        labels: [
                          'Hunger'
                        ]
                    }
                }).catch(logger.error);
            },
            processStarvation: function (playerData, player) {
                var deathCount = Math.min(player.village.population, player.village.hunger),
                    message = '@' + player.name + '\'s village, ' + player.village.name + ' had ' + deathCount + ' people starve to death.';
            
                logger.log('  - ' + message);
                
                player.village.population -= deathCount;
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

                if (player.village.hunger > 0) {
                    hungerProcessor.processStarvation(playerData, player);
                }
                
                if (player.village.population === 0) {
                    delete player.village;
                    player.points = 0;
                    github.updatePlayerFile(playerData, '@' + player.name + '\'s village has all starved to death. Their village has been removed, and their points have been reduced to 0.');
                    return;
                }

                var production = hungerProcessor.processFarmProduction(player);

                player.village.hunger += player.village.population;

                logger.log('  - ' + player.name + ': population - ' + player.village.population + ' | hunger: ' + player.village.hunger);

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
            }
        };

    module.exports = hungerProcessor;

}());
