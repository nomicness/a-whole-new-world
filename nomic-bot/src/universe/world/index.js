import { constructWorld } from './utils';
import { getComment, getPlayers, getPlayer, getCommentsUrl} from './base-world';

export default constructWorld(
    getComment,
    getCommentsUrl,
    getPlayers,
    getPlayer,
)
