(function () {
    'use strict';
    var schedule = require('node-schedule'),
        moment = require('moment-timezone'),
        _ = require('lodash'),
        config = require('../config/server-config.js'),
        logger = require('../utils/logger.js'),
        github = require('../utils/github.js'),
        populationGrowthProcessor = {
            job: null,
            jobSchedule: '0 0 15 1 * *',
            growthFunction: function (n, h) {
                var v = 1/(Math.pow(h+n,2)+1);
                return Math.floor(n * Math.pow(Math.E, 0.011 + v));
            },
            scheduleJob: function () {
                if (populationGrowthProcessor.job) {
                    populationGrowthProcessor.job.cancel();
                }
                populationGrowthProcessor.job = schedule.scheduleJob(populationGrowthProcessor.jobSchedule, populationGrowthProcessor.processGrowth);
                logger.info('Creating Population Growth Job. Next Run: ' + populationGrowthProcessor.getNextRun());
            },
            getNextRun: function () {
                if (populationGrowthProcessor.job) {
                    return moment(populationGrowthProcessor.job.pendingInvocations()[0].fireDate).tz(config.timezone).format('M/D/YY HH:mm z');
                }
                return 'NONE';
            },
            processGrowth: function () {
                logger.info('Performing Population Growth Process...');
                return github.getPlayerData()
                    .then(function (playerData){
                        if (!playerData.activePlayers) {
                            logger.warn('No active players found!');
                            return;
                        }

                        logger.log(' :: ' + playerData.activePlayers.length + ' active players :: ');

                        _.each(playerData.activePlayers, populationGrowthProcessor.processPlayerGrowth);

                        return github.updatePlayerFile(playerData, 'Growing the population.')
                            .finally(function () {
                                logger.info('Finished Population Growth Process. Next Population Growth Job Scheduled to run at ' + populationGrowthProcessor.getNextRun());
                            });
                    });
            },
            processPlayerGrowth: function (player) {
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

                var populationCount = populationGrowthProcessor.getTotalPopulation(player),
                    newPopulationCount = populationGrowthProcessor.growthFunction(populationCount, player.village.hunger),
                    populationGrowth = newPopulationCount - populationCount;

                player.village.population.general += populationGrowth;

                logger.log('  - ' + player.name + ': population - ' + newPopulationCount + ' | hunger: ' + player.village.hunger);
                
            },
            getTotalPopulation: function (player) {
                return _.sum(_.values(_.get(player, 'village.population')));
            }
        };

    module.exports = populationGrowthProcessor;

}());
