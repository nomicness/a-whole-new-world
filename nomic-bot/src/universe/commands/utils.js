import _ from 'lodash';
import multi from 'multiple-methods';

const commands = multi(action => action.type)
    .defaultMethod(() => console.log('Command not found. Make sure you imported your command to commands/index'));

export const addCommand = (type, fn) => commands.method(type, fn);

export default commands;