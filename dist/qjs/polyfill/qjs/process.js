import * as os from 'qjs:os';
import * as std from 'qjs:std';
import { each } from '../../lib/iterate.js';
import { isTypedArray, isArrayBuffer, toString } from '../../lib/types.js';
import { format, split } from '../../lib/util.js';
import { Duplex } from './stream.js';

const env = std.getenviron();
const pid = os.getpid();
const argv = [argv0, ...scriptArgs];

let uid = -1;
let gid = -1;
let groups = [];
let id;
let status;

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
// Note: Works on linux and windows (cmd), but not darwin
// https://man7.org/linux/man-pages/man5/proc.5.html
function getProcStatus (stale=true) {
    if (!status || !stale) {
        let err = {};
        let file = std.open(format('/proc/%s/status', pid), 'r', err);
        if (!file) {
            throw new Error(format('Failed to read proc: %s', std.strerror(err.errno)));
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
            throw new Error(format('Failed to close file: %s', std.strerror(err)));
        }
        status = res;
    }
    return status;
}

// Get proc identity info as object
// Note: Works on linux, darwin, and windows (cmd)
function getProcId (stale=true) {
    if (!id || !stale) {
        let tmp = std.tmpfile();
        let pid = os.exec(['id'], { usePath: true, stdout: tmp.fileno(), stderr: tmp.fileno() });
        let [err, status] = os.waitpid(pid, os.WNOHANG);
        if (status !== 0) {
            throw new Error(format('Failed to get proc id: %s', std.strerror(err)))
        }
        tmp.seek(0, std.SEEK_SET);
        let entries = tmp.readAsString();
        err = tmp.close();
        if (err) {
            throw new Error(format('Failed to close file: %s', std.strerror(err)));
        }
        let res = {};
        each(split(entries, /\s+/), entry => {
            let [key, val] = split(entry, '=', { limit: 1, trim: true });
            val = split(val, /\D+/, { trim: true });
            res[key] = val;
        });
        id = res;
    }
    return id;
}

// Get proc identity info as array
// Note: Caches values for future identity fn calls
function getProcInfo (stale=true) {
    if (((uid & gid) === -1) || !stale) {
        let id = getProcId(stale);
        uid = id.uid[0];
        gid = id.gid[0];
        groups = id.groups;
    }
    return [uid, gid, groups];
}

getProcInfo();

function getuid () {
    return uid;
}

function getgid () {
    return gid;
}

function getgroups () {
    return groups;
}

const nextTick = queueMicrotask;

// Note: All 3 stdio streams in node are Duplex streams, except
// stdin can be Readable if fd 0 is a file
class Stdin extends Duplex {

    stdio = std.in;
    buffer = [];
    ended = false;
    hasRead = false;

    constructor () {
        super();
        this.on('newListener', (name, fn) => {
            switch (name) {
                case 'readable':
                    queueMicrotask(() => {
                        fn();
                    });
                    break;
                case 'data':
                    queueMicrotask(() => {
                        this.readTilEmpty();
                    });
                    break;
            }
        });
    }

    // Readable push, adds to internal buffer
    // Should push(null) when finished to signal end
    // push (chunk, enc) {
    //
    // }

    // Note: This will read stdio one time until end
    // For piping files or small input this is fine, but it's not great
    // for piping large amounts of data
    // Note: Need to implement some sort of chunked read mechanism
    // Readable read, pulls from internal buffer, once empty should emit 'end'
    read (size) {
        if (!this.hasRead) {
            this.hasRead = true;
            // Read as utf8 til end
            let str = this.stdio.readAsString();
            this.emit('data', str);
            this.end();
            return str;
        }
        return null;
    }

    readTilEmpty () {
        this.read();
    }

    // Writable end, emits 'finish'
    end (chunk, enc, cb) {
        if (!this.ended) {
            this.ended = true;
            queueMicrotask(() => {
                this.emit('end');
            });
        }
    }

    // Readable destroy, emits 'close'
    destroy (err) {
        this.emit('close');
    }

}

class Stdout extends Duplex {

    stdio = std.out;

    write (chunk, enc, cb) {
        // Write only accepts ArrayBuffer
        if (isTypedArray(chunk) || isArrayBuffer(chunk)) {
            this.stdio.write(chunk.buffer || chunk, 0, chunk.byteLength);
        } else {
            this.stdio.puts(toString(chunk));
        }
    }

    // Note: Can't end stdio streams
    end (chunk, enc, cb) {

    }

}

class Stderr extends Duplex {

    stdio = std.err;

    write (chunk, enc, cb) {
        // Write only accepts ArrayBuffer
        if (isTypedArray(chunk) || isArrayBuffer(chunk)) {
            this.stdio.write(chunk.buffer || chunk, 0, chunk.byteLength);
        } else {
            this.stdio.puts(toString(chunk));
        }
    }

    // Note: Can't end stdio streams
    end (chunk, enc, cb) {

    }

}

const stdin = new Stdin();
const stdout = new Stdout();
const stderr = new Stderr();

var process = {
    env,
    pid,
    argv,
    cwd,
    getuid,
    getgid,
    getgroups,
    nextTick,
    stdin,
    stdout,
    stderr
};

export { argv, cwd, process as default, env, getProcId, getProcInfo, getProcStatus, getgid, getgroups, getuid, nextTick, pid, stderr, stdin, stdout };
