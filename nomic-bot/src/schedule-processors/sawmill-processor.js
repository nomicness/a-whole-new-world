'use strict';
import schedule from 'node-schedule';
import moment from 'moment-timezone';
import _ from 'lodash';
import config from '../config/server-config.js';
import logger from '../utils/logger.js';
import github from '../utils/github.js';
import rollProcessor from '../command-processors/roll-processor.js';
const sawmillProcessor = {
    job: null,
    jobSchedule: '0 0 15 * * 1',
    sawmillProduction: '/roll 1d12+3',
    loggersRequired: 6,
    scheduleJob: function () {
        if (sawmillProcessor.job) {
            sawmillProcessor.job.cancel();
        }
        sawmillProcessor.job = schedule.scheduleJob(sawmillProcessor.jobSchedule, sawmillProcessor.processProduction);
        logger.info('Creating Sawmill Production Job. Next Run: ' + sawmillProcessor.getNextRun());
    },
    getNextRun: function () {
        if (sawmillProcessor.job) {
            return moment(sawmillProcessor.job.pendingInvocations()[0].fireDate).tz(config.timezone).format('M/D/YY HH:mm z');
        }
        return 'NONE';
    },
    getActiveSawmills: function (player, sawmillCount) {
        const sawmills = sawmillCount || _.get(player, 'village.sawmills', 0), loggers = _.get(player, 'village.population.logging', 0);

        return Math.floor(Math.max(0, sawmills - Math.max(0, sawmills * sawmillProcessor.loggersRequired - loggers) / sawmillProcessor.loggersRequired));
    },
    processSawmillProduction: function (player, mills) {
        const activeMills = sawmillProcessor.getActiveSawmills(player, mills), production = _.sum(_.times(activeMills, _.partial(rollProcessor.sum, sawmillProcessor.sawmillProduction, {}))), currentLumber = _.get(player, 'village.lumber', 0);

        logger.log('  - Processing Sawmill Production for ' + player.name + ': ' + activeMills + ' - ' + production);

        if (!player || !player.village) {
            return 0;
        }

        player.village.lumber = currentLumber + production;

        return production;
    },
    processProduction: function () {
        logger.info('Performing Sawmill Production Process...');
        return github.getPlayerData()
            .then(function (playerData){
                if (!playerData.activePlayers) {
                    logger.warn('No active players found!');
                    return;
                }

                logger.log(' :: ' + playerData.activePlayers.length + ' active players :: ');

                _.each(playerData.activePlayers, sawmillProcessor.processPlayerProduction);

                return github.updatePlayerFile(playerData, 'Sawmill Production.')
                    .finally(function () {
                        logger.info('Finished Sawmill Production Process. Next Sawmill Production Job Scheduled to run at ' + sawmillProcessor.getNextRun());
                    });
            });
    },
    processPlayerProduction: function (player) {
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

        sawmillProcessor.processSawmillProduction(player);
    }
};

export default sawmillProcessor;
