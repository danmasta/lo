import * as lib from './lib/browser.js';
import { addType, addTypes, BREAK, identity, noop, TYPES } from './lib/constants.js';
import * as ip from './lib/ip.js';
import * as iterate from './lib/iterate.js';
import * as types from './lib/types.js';
import * as util from './lib/util.js';
import supplemental from './types/browser.js';

addTypes(supplemental);

export * from './lib/browser.js';
export { addType, addTypes, BREAK, identity, noop, TYPES } from './lib/constants.js';
export * from './lib/ip.js';
export * from './lib/iterate.js';
export * from './lib/types.js';
export * from './lib/util.js';

export default {
    addType,
    addTypes,
    BREAK,
    identity,
    noop,
    TYPES,
    ...ip,
    ...iterate,
    ...lib,
    ...types,
    ...util
};
