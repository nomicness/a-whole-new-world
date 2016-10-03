import { addCommand, updatePlayer, createComment } from './index';
import moment from 'moment';
import { chain, startsWith, isFinite, min, max } from 'lodash';



addCommand('/happy', (_, { playerComments, player }) => {
    const now = moment();
    const happyInTheLastWeek = chain(playerComments)
        .filter(comment => startsWith(comment.body, '/happy'))
        .map(comment => now.diff(moment(comment.created_at), 'week'))
        .filter(weeks => weeks < 1)
        .value()
        .length

    // There should only be one in the last week (the one that triggered this)
    if (happyInTheLastWeek <= 1) {
        player.village.happiness = isFinite(player.village.happiness) ? player.village.happiness : 0;
        player.village.happiness += 1;

        // Keep this in the bounds defined by the law
        player.village.happiness = min([player.village.happiness, 5]);
        player.village.happiness = max([player.village.happiness, -5]);
        return [
            updatePlayer(player),
            createComment(`You village is happier! Happiness: ${player.village.happiness}`)
        ]
    }
    return [
        createComment('You can only run happiness once a week')
    ]
})