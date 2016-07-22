import { constructWorld } from './utils';
import {
    getComment,
    getPlayers,
    getPlayer,
    getCommentsUrl,
    getLabels,
    getIssueAuthor,
} from './base-world';

export default constructWorld(
    getComment,
    getCommentsUrl,
    getPlayers,
    getPlayer,
    getLabels,
    getIssueAuthor,
)
