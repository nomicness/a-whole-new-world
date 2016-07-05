import multi from 'multiple-methods';
import allocate from './allocate';
import _ from 'lodash';
import { bang } from './big-bang';
import { interpret } from './interpreter';

const handleRequest = multi(action => action.type)
    .method('/allocate', allocate)
    .defaultMethod(_.noop)

const commentToCommand = ([type, ...args]) => ({
    type,
    args,
})


export async function create(requestBody) {
    const command = commentToCommand(requestBody.comment.body.split(' '));
    const bigBang = _.partial(bang, command, requestBody);
    const { world, actions } = await bigBang(handleRequest)
    return _.map(actions, action => interpret(action, world))
}