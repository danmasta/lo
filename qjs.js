import * as argv from './lib/argv.js';
import { addType, addTypes, BREAK, noop, TYPES } from './lib/constants.js';
import * as env from './lib/env.js';
import * as ip from './lib/ip.js';
import * as iterate from './lib/iterate.js';
import * as lib from './lib/node.js';
import * as types from './lib/types.js';
import * as util from './lib/util.js';
import supplemental from './types/node.js';

addTypes(supplemental);

export * from './lib/argv.js';
export { addType, addTypes, BREAK, noop, TYPES } from './lib/constants.js';
export * from './lib/env.js';
export * from './lib/ip.js';
export * from './lib/iterate.js';
export * from './lib/node.js';
export * from './lib/types.js';
export * from './lib/util.js';

export default {
    addType,
    addTypes,
    BREAK,
    noop,
    TYPES,
    ...argv,
    ...env,
    ...ip,
    ...iterate,
    ...lib,
    ...types,
    ...util
};
