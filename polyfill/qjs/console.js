import { EOL } from './os.js';
import { stderr, stdout } from './process.js';
import { format } from './util.js';

function logFn (stdio) {
    return function log (msg, ...args) {
        stdio.write(format(msg, ...args) + EOL);
    }
}

export const log = logFn(stdout);
export const debug = log;
export const info = log;
export const error = logFn(stderr);
export const warn = error;

export default {
    log,
    debug,
    info,
    error,
    warn
};
