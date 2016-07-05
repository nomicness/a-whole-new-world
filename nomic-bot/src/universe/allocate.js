import { updatePlayer, createComment } from './actions';

export default ({args: [amount, job, _, from="general"]}, { player }) => {
    player.village.population[job] = player.village.population[job] || 0;
    player.village.population[job] += Number(amount);
    player.village.population[from] = player.village.population[from] || 0;
    player.village.population[from] -= Number(amount);
    if (player.village.population[from] < 0) {
        return [createComment(`You do not have enough ${from} population to allocate ${amount} ${jobs}, ${player.name}`)]
    }
    return [
        updatePlayer(player), 
        createComment(`Allocated ${amount} ${job} from ${from}, ${player.name}`)
    ] 
}