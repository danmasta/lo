import { stderr, stdout, win32 } from './process.js';
import { format } from './util.js';

const eol = win32 ? '\r\n' : '\n';

function logFn (stdio) {
    return function log (msg, ...args) {
        stdio.write(format(msg, ...args) + eol);
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
