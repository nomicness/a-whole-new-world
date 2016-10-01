import { addCommand, updatePlayer, createComment } from './index';
import moment from 'moment';
import { chain, startsWith } from 'lodash';


addCommand('/comehere', ({ args: [ name ] }, { player }) => {

    if (player.dog) {
        return [
            createComment('You already have a dog.')
        ]
    }

    player.dog = { name };
    return [
        updatePlayer(player),
        createComment(`Say hello to your new best friend, ${name} :)`)
    ]
})