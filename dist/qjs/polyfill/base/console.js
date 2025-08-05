import { stderr, EOL, stdout } from '../qjs/core.js';
import './process.js';
import { format } from './util.js';

function logFn (stdio) {
    let eol = EOL ;
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
