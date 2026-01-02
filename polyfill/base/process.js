import { argv, cwd, env, getgid, getgroups, getuid, nextTick, pid, platform, stderr, stdin, stdout } from '#polyfill/core';
import { resolve } from '#polyfill/path';

// https://github.com/nodejs/node/blob/d89657c29e69043289ae0f75d87cca634d396bff/lib/internal/process/pre_execution.js#L234
if (argv[1] && argv[1][0] !== '-') {
    argv[1] = resolve(argv[1]);
}

export {
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

export default {
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
