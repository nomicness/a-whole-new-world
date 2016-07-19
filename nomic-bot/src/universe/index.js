import _ from 'lodash';
import { bang } from './big-bang';
import { interpret } from './interpreter';
import commands from './register-commands';
import './commands';
import { commentToCommand } from './utils';

export async function create(requestBody) {
    const command = commentToCommand(requestBody.comment.body.split(' '));
    const bigBang = _.partial(bang, command, requestBody);
    const { world, actions } = await bigBang(commands)
    return _.map(actions, action => interpret(action, world))
}
