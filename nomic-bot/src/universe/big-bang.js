import _ from 'lodash/fp';
import bigBang from './world';

// Every one of our commands are going to have the following type signature:
// Command -> World -> {world :: World, actions :: List Action}
// bang is the function that creates our "World"

export async function bang(command, request, fn) {
    const world = await bigBang({ request })
    const actions = fn(command, world)
    return {
        world,
        actions,
    }
}
