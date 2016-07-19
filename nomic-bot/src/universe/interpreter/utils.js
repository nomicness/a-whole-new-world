import multi from 'multiple-methods';
import * as actions from '../actions';
import _ from 'lodash';


const interpreter = multi(action => action.type)
    .defaultMethod(_.noop)


export const addInterpretation = (type, fn) => interpreter.method(type, fn);
export default interpreter;
