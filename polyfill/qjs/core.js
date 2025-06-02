import { exec, getcwd, getpid, platform, waitpid, WNOHANG } from 'qjs:os';
import { getenviron, open, SEEK_SET, strerror, tmpfile } from 'qjs:std';
import { each } from '../../lib/iterate.js';
import { fmt, split } from '../../lib/util.js';

export const isWin32 = platform === 'win32';
export const env = getenviron();
export const pid = getpid();
export const EOL = isWin32 ? '\r\n' : '\n';
export const sep = isWin32 ? '\\' : '/';
export const delimiter = isWin32 ? ';' : ':';
export const argv = [argv0, ...scriptArgs];

// Note: For njs, could possibly use env directive to get PWD
// Or readlink /proc/${pid}/cwd
export function cwd () {
    let [str, err] = getcwd();
    if (err) {
        throw new Error(fmt('Failed to get cwd: %s', strerror(err.errno)));
    }
    return str;
}

// Get proc status as object
// Note: Works on linux and windows (cmd), but not darwin
// https://man7.org/linux/man-pages/man5/proc.5.html
export function procStatus () {
    let err = {};
    let file = open(fmt('/proc/%s/status', pid), 'r', err);
    if (!file) {
        throw new Error(fmt('Failed to read proc: %s', strerror(err.errno)));
    }
    let res = {};
    let entry;
    while ((entry = file.getline()) !== null) {
        let val = split(entry, /\s+/);
        let key = val.shift().slice(0, -1);
        res[key] = val;
    }
    err = file.close();
    if (err) {
        throw new Error(fmt('Failed to close file: %s', strerror(err)));
    }
    return res;
}

// Get proc identity info as object
// Note: Works on linux, darwin, and windows (cmd)
// https://man7.org/linux/man-pages/man1/id.1.html
export function id () {
    let tmp = tmpfile();
    let pid = exec(['id'], { usePath: true, stdout: tmp.fileno(), stderr: tmp.fileno() });
    let [err, status] = waitpid(pid, WNOHANG);
    if (status !== 0) {
        throw new Error(fmt('Failed to get proc id: %s', strerror(err)))
    }
    tmp.seek(0, SEEK_SET);
    let entries = tmp.readAsString();
    err = tmp.close();
    if (err) {
        throw new Error(fmt('Failed to close file: %s', strerror(err)));
    }
    let res = {};
    each(split(entries, /\s+/), entry => {
        let [key, val] = split(entry, '=', { limit: 1, trim: true });
        val = split(val, /\D+/, { trim: true });
        res[key] = val;
    });
    return res;
}

// Get proc identity info as array
export function procId () {
    let { uid, gid, groups } = id();
    return [uid[0], gid[0], groups];
}

export const [uid, gid, groups] = procId();

export {
    platform
};
