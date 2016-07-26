import { action } from './utils'

export const updatePlayer = action('updatePlayer', player => ({ player }));
export const createComment = action('createComment', comment => ({ comment }));
