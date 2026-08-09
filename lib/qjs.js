import { getcwd } from 'qjs:os';
import { getenv, getenviron, setenv, strerror } from 'qjs:std';
import { createArgv } from './argv.js';
import { createEnv } from './env.js';
import { fmt } from './util.js';

export const ARGV = [argv0, ...scriptArgs];

export function CWD () {
    let [str, err] = getcwd();
    if (err) {
        throw new Error(fmt('Failed to get cwd: %s', strerror(err.errno)));
    }
    return str;
}

// Note: Read-only copy of env (modifications will not persist to real environ)
export const ENV = getenviron();

function getEnv (key) {
    return key ? getenv(key) : getenviron();
}

function setEnv (key, val) {
    return setenv(key, val);
}

export const env = createEnv(getEnv, setEnv);

export const { parseArgv, optsFromArgv } = createArgv(ARGV);

export {
    parseArgv as argv
};
