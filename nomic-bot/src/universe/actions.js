const action = (type, f=identity) => {
    const actionCreator = (obj) => Object.assign({}, {
        type: type
    }, f(obj))
    actionCreator.type = type;
    return actionCreator;
}

export const updatePlayer = action('updatePlayer', player => ({ player }));
export const createComment = action('createComment', comment => ({ comment }));