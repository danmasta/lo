import { EOL } from './core.js';
import { stdout, stderr } from './process.js';
import { format } from './util.js';

function logFn (stdio) {
    return function log (msg, ...args) {
        stdio.write(format(msg, ...args) + EOL);
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
