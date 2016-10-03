import { sendCommentMessage } from '../../utils/github'
import { addInterpretation, createComment } from './index';


addInterpretation(createComment, ({ comment }, { commentsUrl }) => {
    return sendCommentMessage(commentsUrl, comment);
})
