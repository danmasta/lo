import { BREAK, noop, addTypes, hasOwn } from './lib/constants.js';
import * as types from './lib/types.js';
import * as util from './lib/util.js';
import typesNode from './types/node.js';
import * as libNode from './lib/node.js';

addTypes(typesNode);

export { BREAK, noop, hasOwn } from './lib/constants.js';
export * from './lib/types.js';
export * from './lib/util.js';
export * from './lib/node.js';

export default {
    BREAK,
    noop,
    hasOwn,
    ...types,
    ...util,
    ...libNode
};
