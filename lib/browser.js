import { TYPES } from './constants.js';
import { getType } from './types.js';

export function isNodeList (obj) {
    return getType(obj) === TYPES.NodeList;
}
export function isElement (obj) {
    return obj instanceof TYPES.Element.ctor;
}
