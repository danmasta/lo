import * as os from 'qjs:os';
import * as std from 'qjs:std';
import { isArrayBuffer, isTypedArray, toString } from '../../lib/types.js';
import { fmt, split } from '../../lib/util.js';
import { Duplex } from './stream.js';

export const env = std.getenviron();
export const pid = os.getpid();
export const argv = [argv0, ...scriptArgs];
let uid = -1;
let gid = -1;
let groups = [];
let proc;

// For njs, could possibly use env directive to get PWD
// OR readlink(`/proc/${pid}/cwd`)
export function cwd () {
    let [str, err] = os.getcwd();
    if (err) {
        throw new Error(fmt('Failed to get cwd: %s', std.strerror(err.errno)));
    }
    return str;
}

// Get proc status as object
// https://man7.org/linux/man-pages/man5/proc.5.html
function getProc () {
    if (!proc) {
        let err = {};
        let file = std.open(fmt('/proc/%s/status', pid), 'r', err);
        if (!file) {
            throw new Error(fmt('Failed to read proc: %s', std.strerror(err.errno)));
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
            throw new Error(fmt('Failed to close file: %s', std.strerror(err)));
        }
        proc = res;
    }
    return proc;
}

export function getProcInfo () {
    if ((uid & gid) === -1) {
        let proc = getProc();
        uid = proc.Uid[0];
        gid = proc.Gid[0];
        groups = proc.Groups;
    }
    return [uid, gid, groups];
}

getProcInfo();

export function getuid () {
    return uid;
}

export function getgid () {
    return gid;
}

export function getgroups () {
    return groups;
}

export const nextTick = queueMicrotask;

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
                default:
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

export const stdin = new Stdin();
export const stdout = new Stdout();
export const stderr = new Stderr();

export default {
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
