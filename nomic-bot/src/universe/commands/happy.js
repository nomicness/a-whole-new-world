import {
    throttledCommand,
    updatePlayer,
    createComment,
    add,
} from './index';

throttledCommand('/happy', 'week', (_, { player }) => {

    player.village.happiness = add(player.village.happiness, 1, {min: -5, max: 5})
    return [
        updatePlayer(player),
        createComment(`Your village is happier! Happiness: ${player.village.happiness}`)
    ]
})