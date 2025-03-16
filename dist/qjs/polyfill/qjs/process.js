import { format, split } from '../../lib/util.js';

const env = std.getenviron();
const pid = os.getpid();
const argv = [argv0, ...scriptArgs];
let uid = -1;
let gid = -1;
let groups = [];
let proc;

// For njs, could possibly use env directive to get PWD
// OR readlink(`/proc/${pid}/cwd`)
function cwd () {
    let [str, err] = os.getcwd();
    if (err) {
        throw new Error(format('Failed to get cwd: %s', std.strerror(err.errno)));
    }
    return str;
}

// Get proc status as object
// https://man7.org/linux/man-pages/man5/proc.5.html
function getProc () {
    if (!proc) {
        let err = {};
        let file = std.open(format('/proc/%s/status', pid), 'r', err);
        if (!file) {
            throw new Error(format('Failed to read proc: %s', std.strerror(err.errno)));
        }
        let res = {};
        let line;
        while((line = file.getline()) !== null) {
            let val = split(line, /\s+/);
            let key = val.shift().slice(0, -1);
            res[key] = val;
        }
        err = file.close();
        if (err) {
            throw new Error(format('Failed to close file: %s', std.strerror(err)));
        }
        proc = res;
    }
    return proc;
}

function getProcInfo () {
    if ((uid & gid) === -1) {
        let proc = getProc();
        uid = proc.Uid[0];
        gid = proc.Gid[0];
        groups = proc.Groups;
    }
    return [uid, gid, groups];
}

getProcInfo();

export { argv, cwd, env, getProcInfo, pid };
