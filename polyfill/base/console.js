import { appendEOL } from '#polyfill/core';
import { EOL } from '#polyfill/os';
import { stderr, stdout } from '#polyfill/process';
import { format } from '#polyfill/util';

function logFn (stdio) {
    let eol = appendEOL ? EOL : '';
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
