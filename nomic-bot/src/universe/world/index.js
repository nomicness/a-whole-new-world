import { constructWorld } from './utils';
import {
    getComment,
    getPlayers,
    getPlayer,
    getCommentsUrl,
    getAllComments,
    getLabels,
    getIssueAuthor,
    getCommentsForPlayer,
} from './base-world';

export default constructWorld(
    getComment,
    getCommentsUrl,
    getAllComments,
    getPlayers,
    getPlayer,
    getLabels,
    getIssueAuthor,
    getCommentsForPlayer,
)
