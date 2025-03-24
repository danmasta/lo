import '../../lib/constants.js';
import { format, split } from '../../lib/util.js';
import { Duplex } from './stream.js';

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

new Stdin();

export { argv, cwd, env, getProcInfo, pid };
