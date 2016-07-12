import _ from 'lodash';
import multi from 'multiple-methods';

const commands = multi(action => action.type)
    .defaultMethod(_.noop)

export const addCommand = (type, fn) => commands.method(type, fn);

export default commands;