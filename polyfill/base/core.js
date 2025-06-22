import { EOL } from 'node:os';
import { delimiter, sep } from 'node:path';
import { argv, cwd, env, getgid, getgroups, getuid, nextTick, pid, platform, stderr, stdin, stdout } from 'node:process';

export const isWin32 = platform === 'win32';
export const uid = getuid();
export const gid = getgid();
export const groups = getgroups();
export const appendEOL = true;

export {
    argv,
    cwd,
    delimiter,
    env,
    EOL,
    getgid,
    getgroups,
    getuid,
    nextTick,
    pid,
    platform,
    sep,
    stderr,
    stdin,
    stdout
};
