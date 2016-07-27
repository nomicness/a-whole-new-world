import multi from 'multiple-methods';
import * as actions from '../actions';
import _ from 'lodash';


const interpreter = multi(action => action.type)
    .defaultMethod(() => console.log('Interpreter not found. Make sure you imported your interpreter to interpreter/index'))


export const addInterpretation = (type, fn) => interpreter.method(_.isString(type) ? type : type.type, fn);
export default interpreter;
