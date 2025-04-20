import { stdout, stderr, win32 } from './process.js';
import { format } from './util.js';

const eol = win32 ? '\r\n' : '\n';

function logFn (stdio) {
    return function log (msg, ...args) {
        stdio.write(format(msg, ...args) + eol);
    }
}

const log = logFn(stdout);
const debug = log;
const info = log;
const error = logFn(stderr);
const warn = error;

var console = {
    log,
    debug,
    info,
    error,
    warn
};

export { debug, console as default, error, info, log, warn };
