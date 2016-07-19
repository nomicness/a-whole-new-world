const noop = () => ({});

export const action = (type, f=noop) => {
    const actionCreator = (obj) => ({
        ...f(obj),
        type,
    })
    actionCreator.type = type;
    return actionCreator;
}
