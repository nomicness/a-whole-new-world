import "babel-polyfill";
import { bang } from './universe/big-bang';

const testing = process.env.TESTING || false;
import serverConfig from './config/server-config.js';
import ApiServer from './utils/api-server.js';
import * as logger from './utils/logger.js';
import * as pullProcessor from './endpoint-processors/pull-request-processor.js';
import * as commentProcessor from './endpoint-processors/comment-processor.js';
import * as hungerProcessor from './schedule-processors/hunger-processor.js';
import * as populationGrowthProcessor from './schedule-processors/population-growth-processor.js';
import * as sawmillProcessor from './schedule-processors/sawmill-processor.js';
const apiServer = new ApiServer(serverConfig);

if (testing) {
    logger.info('SYSTEM IS IN TESTING MODE!');
}

pullProcessor.initializeEndpoint(apiServer);
commentProcessor.initializeEndpoint(apiServer);
hungerProcessor.scheduleJob();
populationGrowthProcessor.scheduleJob();
sawmillProcessor.scheduleJob();
