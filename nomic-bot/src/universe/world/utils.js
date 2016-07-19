import _ from 'lodash/fp';

async function constructStep(world, build) {
    const currentWorld = await world;
    const newWorld = await build(currentWorld);
    return {
        ...currentWorld,
        ...newWorld,
    }
}


export const constructWorld = (...args) => world => 
    _.reduce(constructStep, Promise.resolve(world), args)


