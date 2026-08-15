import { getcwd, isatty, platform } from 'qjs:os';
import { err, getenv, getenviron, out, setenv, strerror } from 'qjs:std';
import { createArgv } from './argv.js';
import { createConsole } from './console.js';
import { createEnv } from './env.js';
import { inspect } from './inspect.js';
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

const printOut = str => out.puts(str);
const printErr = str => err.puts(str);

export const console = createConsole({
    inspect,
    eol: platform === 'win32' ? '\r\n' : '\n',
    stdout: { write: printOut, colors: isatty(out) },
    stderr: { write: printErr, colors: isatty(err) }
});

export {
    parseArgv as argv
};
