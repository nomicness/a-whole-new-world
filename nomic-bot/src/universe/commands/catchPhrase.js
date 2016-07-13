import { addCommand, updatePlayer, createComment } from './index';

addCommand('/catchPhrase', (_, { player }) => {
  return [
    addComment(player.village.catchPhrase || `${player.village.name} doesn't have a catch phrase`)
  ]
})

addCommand('/updateCatchPhrase', ([phrase], { player }) => {
  player.village.catchPhrase = phrase;
  return [
    updatePlayer(player)
  ]
})