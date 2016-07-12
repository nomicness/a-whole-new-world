const noop = () => ({});

const action = (type, f=noop) => {
    const actionCreator = (obj) => ({
        ...f(obj),
        type,
    })
    actionCreator.type = type;
    return actionCreator;
}

export const updatePlayer = action('updatePlayer', player => ({ player }));
export const createComment = action('createComment', comment => ({ comment }));