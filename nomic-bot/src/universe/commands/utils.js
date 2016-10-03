import multi from 'multiple-methods';
import moment from 'moment';
import { chain, startsWith, min, max } from 'lodash';
import { createComment } from '../actions';

const commands = multi(action => action.type)
    .defaultMethod(() => console.log('Command not found. Make sure you imported your command to commands/index'));

export const addCommand = (type, fn) => commands.method(type, fn);

export const throttledCommand = (command, time, fn) => {
    addCommand(command, (...args) => {
        const now = moment();
        const playerComments = args[1].playerComments;

        const commandInTheLastWeek = chain(playerComments)
            .filter(comment => startsWith(comment.body, command))
            .map(comment => now.diff(moment(comment.created_at), time))
            .filter(time => time < 1)
            .value()
            .length

        if (commandInTheLastWeek <= 1) {
            return fn(...args);
        }
        return [
            createComment(`You can only run ${command} every ${time}`)
        ]
    })
}

export const inRange = (lower, upper) => x => {
    x = min([x, upper]);
    x = max([x, lower]);
    return x;
}

export const zeroIfDoesNotExist = (x) => isFinite(x) ? x : 0;

export const add = (x, num, {min: minNum=-Infinity, max: maxNum=Infinity}={}) => {
    x = zeroIfDoesNotExist(x);
    x += num;
    x = inRange(minNum, maxNum)(x);
    return x;
}

export default commands;