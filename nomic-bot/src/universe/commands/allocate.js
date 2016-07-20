import { addCommand, updatePlayer, createComment } from './index';

//  /allocate 3 logging
//  /allocate 3 logging from farmers

addCommand('/allocate', ({args: [amount, job, _, from="general"]}, { player }) => {
    player.village.population[job] = player.village.population[job] || 0;
    player.village.population[job] += Number(amount);
    player.village.population[from] = player.village.population[from] || 0;
    player.village.population[from] -= Number(amount);
    if (player.village.population[from] < 0) {
        return [createComment(`You do not have enough ${from} population to allocate ${amount} ${job}, ${player.name}`)]
    }
    return [
        updatePlayer(player),
        createComment(`Allocated ${amount} ${job} from ${from}, ${player.name}`)
    ]
})