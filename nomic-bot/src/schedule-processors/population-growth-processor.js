import schedule from 'node-schedule';
import moment from 'moment-timezone';
import _ from 'lodash';
import config from '../config/server-config.js';
import * as logger from '../utils/logger.js';
import * as github from '../utils/github.js';

export let job = null;
export const jobSchedule = '0 0 15 1 * *';

export const growthFunction = function (n, h) {
    const v = 1/(Math.pow(h+n,2)+1);
    return Math.floor(n * Math.pow(Math.E, 0.011 + v));
};

export const scheduleJob = function () {
    if (job) {
        job.cancel();
    }
    job = schedule.scheduleJob(jobSchedule, processGrowth);
    logger.info('Creating Population Growth Job. Next Run: ' + getNextRun());
};

export const getNextRun = function () {
    if (job) {
        return moment(job.pendingInvocations()[0].fireDate).tz(config.timezone).format('M/D/YY HH:mm z');
    }
    return 'NONE';
};

export const processGrowth = function () {
    logger.info('Performing Population Growth Process...');
    return github.getPlayerData()
        .then(function (playerData){
            if (!playerData.activePlayers) {
                logger.warn('No active players found!');
                return;
            }

            logger.log(' :: ' + playerData.activePlayers.length + ' active players :: ');

            _.each(playerData.activePlayers, processPlayerGrowth);

            return github.updatePlayerFile(playerData, 'Growing the population.')
                .finally(function () {
                    logger.info('Finished Population Growth Process. Next Population Growth Job Scheduled to run at ' + getNextRun());
                });
        });
};

export const processPlayerGrowth = function (player) {
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

    const populationCount = getTotalPopulation(player);
    const newPopulationCount = growthFunction(populationCount, player.village.hunger);
    const populationGrowth = newPopulationCount - populationCount;

    player.village.population.general += populationGrowth;

    logger.log('  - ' + player.name + ': population - ' + newPopulationCount + ' | hunger: ' + player.village.hunger);
};

export const getTotalPopulation = function (player) {
    return _.sum(_.values(_.get(player, 'village.population')));
};
