import { BREAK, noop, addTypes } from './lib/constants.js';
import * as types from './lib/types.js';
import * as iterate from './lib/iterate.js';
import * as util from './lib/util.js';
import typesBrowser from './types/browser.js';
import * as libBrowser from './lib/browser.js';

addTypes(typesBrowser);

export { BREAK, noop } from './lib/constants.js';
export * from './lib/types.js';
export * from './lib/iterate.js';
export * from './lib/util.js';
export * from './lib/browser.js';

export default {
    BREAK,
    noop,
    ...types,
    ...iterate,
    ...util,
    ...libBrowser
};
