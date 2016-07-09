logger.info('test')
import 'babel-polyfill';
import { bang } from './universe/big-bang';
import serverConfig from './config/server-config.js';
import ApiServer from './utils/api-server.js';
import logger from './utils/logger.js';
import * as commentProcessor from './endpoint-processors/comment-processor.js';
import hungerProcessor from './schedule-processors/hunger-processor.js';
import populationGrowthProcessor from './schedule-processors/population-growth-processor.js';
import sawmillProcessor from './schedule-processors/sawmill-processor.js';
const testing = process.env.TESTING || false, apiServer = new ApiServer(serverConfig);

if (testing) {
    logger.info('SYSTEM IS IN TESTING MODE!');
}

commentProcessor.initializeEndpoint(apiServer);
hungerProcessor.scheduleJob();
populationGrowthProcessor.scheduleJob();
sawmillProcessor.scheduleJob();
