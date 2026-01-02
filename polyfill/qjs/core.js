import { each } from '#lib/iterate';
import { isArrayBuffer, isTypedArray, toString } from '#lib/types';
import { fmt, split } from '#lib/util';
import { Duplex } from '#polyfill/stream';
import * as os from 'qjs:os';
import * as std from 'qjs:std';

const { exec, getcwd, getpid, platform, waitpid, WNOHANG } = os;
const { getenviron, SEEK_SET, strerror, tmpfile } = std;

export const isWin32 = platform === 'win32';
export const env = getenviron();
export const pid = getpid();
export const EOL = isWin32 ? '\r\n' : '\n';
export const sep = isWin32 ? '\\' : '/';
export const delimiter = isWin32 ? ';' : ':';
export const argv = [argv0, ...scriptArgs];
export const appendEOL = true;

// Note: For njs, could possibly use env directive to get PWD
// Or readlink /proc/${pid}/cwd
export function cwd () {
    let [str, err] = getcwd();
    if (err) {
        throw new Error(fmt('Failed to get cwd: %s', strerror(err.errno)));
    }
    return str;
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
// stdin  - Readable if fd 0 is a file
// stdout - Writable if fd 1 is a file
// stderr - Writable if fd 2 is a file
class Stdio extends Duplex {

    constructor (stdio) {
        super();
        this.stdio = stdio;
        this.buffer = [];
        this.ended = false;
        this.hasRead = false;
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

    // Readable push adds to internal buffer
    // Should push(null) when finished to signal end
    push (chunk, enc) {

    }

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

    // Writable write
    write (chunk, enc, cb) {
        // Write only accepts ArrayBuffer
        if (isTypedArray(chunk) || isArrayBuffer(chunk)) {
            this.stdio.write(chunk.buffer || chunk, 0, chunk.byteLength);
        } else {
            this.stdio.puts(toString(chunk));
        }
    }

    // Readable end
    end (chunk, enc, cb) {
        if (!this.ended) {
            this.ended = true;
            queueMicrotask(() => {
                this.emit('end');
            });
        }
    }

    // Writable end
    finish () {

    }

    // Readable destroy emits 'close'
    destroy (err) {
        this.emit('close');
    }

}

export const stdin = new Stdio(std.in);
export const stdout = new Stdio(std.out);
export const stderr = new Stdio(std.err);

export {
    os,
    platform,
    std
};
