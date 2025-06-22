import { argv, cwd, env, getgid, getgroups, getuid, nextTick, pid, platform, stderr, stdin, stdout } from '../qjs/core.js';
import { resolve } from './path.js';

// https://github.com/nodejs/node/blob/d89657c29e69043289ae0f75d87cca634d396bff/lib/internal/process/pre_execution.js#L234
if (argv[1] && argv[1][0] !== '-') {
    argv[1] = resolve(argv[1]);
}

var process = {
    argv,
    cwd,
    env,
    getgid,
    getgroups,
    getuid,
    nextTick,
    pid,
    platform,
    stderr,
    stdin,
    stdout
};

export { argv, cwd, process as default, env, getgid, getgroups, getuid, nextTick, pid, platform, stderr, stdin, stdout };
