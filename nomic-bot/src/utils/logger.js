import moment from 'moment-timezone';
import config from '../config/server-config.js';

const logger = {
    getPrefix: function () {
        return moment().tz(config.timezone).format('[[]M/D/YY HH:mm z[]]: ');
    },
    info: function (message) {
        console.info(logger.getPrefix() + message);
    },
    log: function (message) {
        console.log(message);
    },
    warn: function (message) {
        console.warn(logger.getPrefix() + message);
    },
    error: function (message) {
        console.error(logger.getPrefix(), message);
        throw new Error(message);
    }
};

export default logger;