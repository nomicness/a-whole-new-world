import moment from 'moment-timezone';
import config from '../config/server-config.js';

export const getPrefix = function () {
    return moment().tz(config.timezone).format('[[]M/D/YY HH:mm z[]]: ');
};

export const info = function (message) {
    console.info(getPrefix() + message);
};

export const log = function (message) {
    console.log(message);
};

export const warn = function (message) {
    console.warn(getPrefix() + message);
};

export const error = function (message) {
    console.error(getPrefix(), message);
    throw new Error(message);
};