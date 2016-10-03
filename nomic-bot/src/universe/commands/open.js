import { addCommand, updatePlayer, createComment, addLabel } from './index';

addCommand('/open', (_, { player, author, allLabels }) => {
    if (player.name !== author.name) {
        return [createComment(`${player.name}, you cannot open a proposal which you did not create.`)]
    }
    return [addLabel(allLabels.open)]
})