import schedule from 'node-schedule';
import moment from 'moment-timezone';
import _ from 'lodash';
import config from '../config/server-config.js';
import * as logger from '../utils/logger.js';
import * as github from '../utils/github.js';
import * as rollProcessor from '../command-processors/roll-processor.js';

export let job = null;
export const jobSchedule = '0 0 15 * * 1';
export const sawmillProduction = '/roll 1d12+3';
export const loggersRequired = 6;

export const scheduleJob = function () {
    if (job) {
        job.cancel();
    }
    job = schedule.scheduleJob(jobSchedule, processProduction);
    logger.info('Creating Sawmill Production Job. Next Run: ' + getNextRun());
};

export const getNextRun = function () {
    if (job) {
        return moment(job.pendingInvocations()[0].fireDate).tz(config.timezone).format('M/D/YY HH:mm z');
    }
    return 'NONE';
};

export const getActiveSawmills = function (player, sawmillCount) {
    const sawmills = sawmillCount || _.get(player, 'village.sawmills', 0);
    const loggers = _.get(player, 'village.population.logging', 0);

    return Math.floor(Math.max(0, sawmills - Math.max(0, sawmills * loggersRequired - loggers) / loggersRequired));
};

export const processSawmillProduction = function (player, mills) {
    const activeMills = getActiveSawmills(player, mills);
    const production = _.sum(_.times(activeMills, _.partial(rollProcessor.sum, sawmillProduction, {})));
    const currentLumber = _.get(player, 'village.lumber', 0);

    logger.log('  - Processing Sawmill Production for ' + player.name + ': ' + activeMills + ' - ' + production);

    if (!player || !player.village) {
        return 0;
    }

    player.village.lumber = currentLumber + production;

    return production;
};

export const processProduction = function () {
    logger.info('Performing Sawmill Production Process...');
    return github.getPlayerData()
        .then(function (playerData){
            if (!playerData.activePlayers) {
                logger.warn('No active players found!');
                return;
            }

            logger.log(' :: ' + playerData.activePlayers.length + ' active players :: ');

            _.each(playerData.activePlayers, processPlayerProduction);

            return github.updatePlayerFile(playerData, 'Sawmill Production.')
                .finally(function () {
                    logger.info('Finished Sawmill Production Process. Next Sawmill Production Job Scheduled to run at ' + getNextRun());
                });
        });
};

export const processPlayerProduction = function (player) {
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

    processSawmillProduction(player);
};
