import { isTypedArray, isArrayBuffer, toString } from '../../lib/types.js';
import { argv, env, pid, cwd, uid, gid, groups } from './core.js';
import { resolve } from './path.js';
import { Duplex } from './stream.js';
import { platform } from 'qjs:os';
export { platform } from 'qjs:os';

// https://github.com/nodejs/node/blob/d89657c29e69043289ae0f75d87cca634d396bff/lib/internal/process/pre_execution.js#L234
if (argv[1] && argv[1][0] !== '-') {
    argv[1] = resolve(argv[1]);
}

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
    platform,
    getuid,
    getgid,
    getgroups,
    nextTick,
    stdin,
    stdout,
    stderr
};

export { argv, cwd, process as default, env, getgid, getgroups, getuid, nextTick, pid, stderr, stdin, stdout };
