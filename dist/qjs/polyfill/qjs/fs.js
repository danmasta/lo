import { isTypedArray, isArrayBuffer, toString } from '../../lib/types.js';
import { format } from '../../lib/util.js';
import { uid, groups } from './core.js';
import * as os from 'qjs:os';
import * as std from 'qjs:std';

// https://nodejs.org/api/fs.html#fsconstants
const constants = {
    // Posix open flags (node/qjs)
    O_RDONLY: 0,
    O_WRONLY: 1,
    O_RDWR: 2,
    O_APPEND: 1024,
    O_CREAT: 64,
    O_EXCL: 128,
    O_TRUNC: 512,
    // Posix open flags (node)
    O_DIRECT: 16384,
    O_DIRECTORY: 65536,
    O_DSYNC: 4096,
    O_NOATIME: 262144,
    O_NOCTTY: 256,
    O_NOFOLLOW: 131072,
    O_NONBLOCK: 2048,
    O_SYNC: 1052672,
    // Stat modes (ex: (stat.mode & S_IFREG) === S_IFREG)
    // https://www.gnu.org/software/libc/manual/html_node/Testing-File-Type.html
    S_IFMT: 61440,
    S_IFIFO: 4096,
    S_IFCHR: 8192,
    S_IFDIR: 16384,
    S_IFBLK: 24576,
    S_IFREG: 32768,
    S_IFSOCK: 49152,
    S_IFLNK: 40960,
    // https://www.gnu.org/software/libc/manual/html_node/How-Change-Persona.html
    S_ISGID: 1024,
    S_ISUID: 2048,
    // Stat bitmasks (ex: (stat.mode & S_IRUSR) === S_IRUSR)
    // https://www.gnu.org/software/libc/manual/html_node/Permission-Bits.html
    S_IRWXU: 448, // Read, write, execute owner
    S_IRUSR: 256, // Read owner
    S_IWUSR: 128, // Write owner
    S_IXUSR: 64,  // Execute owner
    S_IRWXG: 56,  // Read, write, execute group
    S_IRGRP: 32,  // Read group
    S_IWGRP: 16,  // Write group
    S_IXGRP: 8,   // Execute group
    S_IRWXO: 7,   // Read, write, execute others
    S_IROTH: 4,   // Read others
    S_IWOTH: 2,   // Write others
    S_IXOTH: 1,   // Execute others
    // Node access mode flags
    // https://nodejs.org/api/fs.html#file-access-constants
    F_OK: 0, // File visible to the calling process (doesn't specify rwx permissions)
    R_OK: 4, // File can be read by the calling process
    W_OK: 2, // File can be written by the calling process
    X_OK: 1, // File can be executed by the calling process
    // Posix seek flags (qjs)
    SEEK_SET: 0,
    SEEK_CUR: 1,
    SEEK_END: 2
};

const {
    O_RDONLY, O_WRONLY, O_RDWR, O_APPEND, O_CREAT, O_EXCL, O_TRUNC,
    S_IFMT, S_IFIFO, S_IFCHR, S_IFDIR, S_IFBLK, S_IFREG, S_IFSOCK, S_IFLNK, S_ISGID, S_ISUID,
    S_IRUSR, S_IWUSR, S_IXUSR, S_IRGRP, S_IWGRP, S_IXGRP, S_IROTH, S_IWOTH, S_IXOTH,
    F_OK, R_OK, W_OK, X_OK,
    SEEK_CUR, SEEK_END, SEEK_SET
} = constants;

const rwx = {
    u: {
        4: S_IRUSR,
        2: S_IWUSR,
        1: S_IXUSR,
        6: S_IRUSR | S_IWUSR,
        5: S_IRUSR | S_IXUSR,
        3: S_IWUSR | S_IXUSR,
        7: S_IRUSR | S_IWUSR | S_IXUSR
    },
    g: {
        4: S_IRGRP,
        2: S_IWGRP,
        1: S_IXGRP,
        6: S_IRGRP | S_IWGRP,
        5: S_IRGRP | S_IXGRP,
        3: S_IWGRP | S_IXGRP,
        7: S_IRGRP | S_IWGRP | S_IXGRP
    },
    o: {
        4: S_IROTH,
        2: S_IWOTH,
        1: S_IXOTH,
        6: S_IROTH | S_IWOTH,
        5: S_IROTH | S_IXOTH,
        3: S_IWOTH | S_IXOTH,
        7: S_IROTH | S_IWOTH | S_IXOTH
    }
};

// File system flags
// a   - Open file for appending. The file is created if it does not exist
// ax  - Like 'a', but fails if the path exists
// a+  - Open file for reading and appending. The file is created if it does not exist
// ax+ - Like 'a+', but fails if the path exists
// as  - Open file for appending in synchronous mode. The file is created if it does not exist
// as+ - Open file for reading and appending in synchronous mode. The file is created if it does not exist
// r   - Open file for reading. An exception occurs if the file does not exist
// rs  - Open file for reading in synchronous mode. An exception occurs if the file does not exist
// r+  - Open file for reading and writing. An exception occurs if the file does not exist
// rs+ - Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache
// w   - Open file for writing. The file is created (if it does not exist) or truncated (if it exists)
// wx  - Like 'w' but fails if the path exists
// w+  - Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists)
// wx+ - Like 'w+' but fails if the path exists

// std.Error codes
// https://www.gnu.org/software/libc/manual/html_node/Error-Codes.html
// EINVAL (22) - Invalid argument
// EIO    (5)  - I/O error
// EACCES (13) - Permission denied
// EEXIST (17) - File exists
// ENOSPC (28) - No space left on device
// ENOSYS (38) - Function not implemented
// EBUSY  (16) - Device or resource busy
// ENOENT (2)  - No such file or directory
// EPERM  (1)  - Operation not permitted
// EPIPE  (32) - Broken pipe
// NONE   (0)  - None
// Get error string message: std.strerror(code);

// Qjs stat object
// Stats {
//     dev, ino, mode, nlink, uid, gid, rdev, size, blocks, atime, mtime, ctime
// }
//
// Node stat object
// Stats {
//     dev: 2114,
//     ino: 48064969,
//     mode: 33188,
//     nlink: 1,
//     uid: 85,
//     gid: 100,
//     rdev: 0,
//     size: 527,
//     blksize: 4096,
//     blocks: 8,
//     atimeMs: 1318289051000.1,
//     mtimeMs: 1318289051000.1,
//     ctimeMs: 1318289051000.1,
//     birthtimeMs: 1318289051000.1,
//     atime: Mon, 10 Oct 2011 23:24:11 GMT,
//     mtime: Mon, 10 Oct 2011 23:24:11 GMT,
//     ctime: Mon, 10 Oct 2011 23:24:11 GMT,
//     birthtime: Mon, 10 Oct 2011 23:24:11 GMT
// }
// isBlockDevice
// isCharacterDevice
// isDirectory
// isFIFO
// isFile
// isSocket
// isSymbolicLink

class Stat {
    constructor (stat) {
        Object.assign(this, stat);
    }
    isBlockDevice () {
        return (this.mode & S_IFBLK) === S_IFBLK;
    }
    isCharacterDevice () {
        return (this.mode & S_IFCHR) === S_IFCHR;
    }
    isDirectory () {
        return (this.mode & S_IFDIR) === S_IFDIR;
    }
    isFIFO () {
        return (this.mode & S_IFIFO) === S_IFIFO;
    }
    isFile () {
        return (this.mode & S_IFREG) === S_IFREG;
    }
    isSocket () {
        return (this.mode & S_IFSOCK) === S_IFSOCK;
    }
    isSymbolicLink () {
        return (this.mode & S_IFLNK) === S_IFLNK;
    }
}

function statSync (path, opts) {
    let [stat, err] = os.stat(path);
    if (err) {
        throw new Error(format('Stat failed: %s', std.strerror(err)));
    }
    return new Stat(stat);
}

async function stat (path, opts) {
    return statSync(path);
}

// Check if calling process uid/gid matches file
// Check permissions against owner/group/other rwx bits
function accessSync (path, mode=F_OK) {
    let [stat, err] = os.stat(path);
    if (err) {
        throw new Error(format('Access failed: %s', std.strerror(err)));
    }
    if (mode === F_OK) {
        return;
    }
    let mask;
    if (stat.uid === uid) {
        mask = rwx.u[mode];
    } else if (stat.gid in groups) {
        mask = rwx.g[mode];
    } else {
        mask = rwx.o[mode];
    }
    if ((stat.mode & mask) === mask) {
        return;
    }
    throw new Error(format('Access failed: %s', std.strerror(std.Error.EACCES)));
}

async function access (path, mode) {
    return accessSync(path, mode);
}

// Can only mkdir one level at a time, need to recurse somehow
// Split dir into multiple dirs, find last realpath, then append from there
function mkdirSync (path, mode) {
    let err = os.mkdir(path, mode);
    if (err) {
        throw new Error(format('Failed to create dir: %s', std.strerror(err)));
    }
}

async function mkdir (path, mode) {
    return mkdirSync(path, mode);
}

// https://github.com/bellard/quickjs/blob/master/quickjs-libc.c#L1623
function openSync (path, flags='r', mode=0o666) {
    let fd = os.open(path, flags, mode);
    if (fd < 0) {
        throw new Error(format('Failed to get fd: %s', std.strerror(fd)));
    }
    return fd;
}

async function open (path, flags, mode) {
    return openSync(path, flags, mode);
}

function readSync (fd, buffer, offset, length, position) {
    if (pos) {
        os.seek(fd, position, SEEK_SET);
    }
    let res = os.read(fd, buffer, offset, length);
    if (res < 0) {
        throw new Error(format('Failed to read: %s', std.strerror(res)));
    }
    return res;
}

async function read (fd, buffer, offset, length, position) {
    return readSync(fd, buffer, offset, length, position);
}

function closeSync (fd) {
    os.close(fd);
}

async function close (fd) {
    closeSync(fd);
}

function readdirSync (path) {
    let [res, err] = os.readdir(path);
    if (err) {
        throw new Error(format('Failed to readdir: %s', std.strerror(err)));
    }
    return res.filter(str => {
        return str !== '.' && str !== '..';
    });
}

async function readdir (path) {
    return readdirSync(path);
}

// Data can be String, ArrayBuffer, or Uint8Array
// Note: For some reason getting a fd, and using std.fdopen doesn't work
// https://github.com/bellard/quickjs/blob/master/quickjs-libc.c#L971
// https://github.com/bellard/quickjs/blob/master/quickjs-libc.c#L1623
function appendFileSync (path, data, { encoding='utf8', mode=0o666, flag='a', flush=false }={}) {
    let err = {};
    let file = std.open(path, flag, err);
    if (err.errno) {
        throw new Error(format('Failed to open file: %s', std.strerror(err.errno)));
    }
    // Write only accepts ArrayBuffer
    if (isTypedArray(data) || isArrayBuffer(data)) {
        file.write(data.buffer || data, 0, data.byteLength);
    } else {
        file.puts(toString(data));
    }
    if (flush) {
        file.flush();
    }
    err = file.close();
    if (err) {
        throw new Error(format('Failed to close file: %s', std.strerror(err)));
    }
}

async function appendFile (path, data, opts) {
    return appendFileSync(path, data, opts);
}

function readFileSync (path, { encoding=null, flag='r' }={}) {
    let err = {};
    let res;
    let file = std.open(path, flag, err);
    if (err.errno) {
        throw new Error(format('Failed to open file: %s', std.strerror(err.errno)));
    }
    if (encoding === 'utf8') {
        res = file.readAsString();
    } else {
        file.seek(0, SEEK_END);
        res = new ArrayBuffer(file.tell());
        file.seek(0, SEEK_SET);
        file.read(res, 0, res.byteLength);
        res = new Uint8Array(res);
    }
    err = file.close();
    if (err) {
        throw new Error(format('Failed to close file: %s', std.strerror(err)));
    }
    return res;
}

async function readFile (path, opts) {
    return readFileSync(path, opts);
}

// Data can be String, ArrayBuffer, or Uint8Array
// Note: For some reason getting a fd, and using std.fdopen doesn't work
function writeFileSync (path, data, { encoding='utf8', mode=0o666, flag='w', flush=false }={}) {
    let err = {};
    let file = std.open(path, flag, err);
    if (err.errno) {
        throw new Error(format('Failed to open file: %s', std.strerror(err.errno)));
    }
    // Write only accepts ArrayBuffer
    if (isTypedArray(data) || isArrayBuffer(data)) {
        file.write(data.buffer || data, 0, data.byteLength);
    } else {
        file.puts(toString(data));
    }
    if (flush) {
        file.flush();
    }
    err = file.close();
    if (err) {
        throw new Error(format('Failed to close file: %s', std.strerror(err)));
    }
}

async function writeFile (path, data, opts) {
    return writeFileSync(path, data, opts);
}

const promises = {
    stat,
    access,
    mkdir,
    open,
    read,
    close,
    readdir,
    appendFile,
    readFile,
    writeFile,
    constants
};

var fs = {
    statSync,
    accessSync,
    mkdirSync,
    openSync,
    readSync,
    closeSync,
    readdirSync,
    appendFileSync,
    readFileSync,
    writeFileSync,
    promises,
    constants
};

export { access, accessSync, appendFile, appendFileSync, close, closeSync, constants, fs as default, mkdir, mkdirSync, open, openSync, promises, read, readFile, readFileSync, readSync, readdir, readdirSync, stat, statSync, writeFile, writeFileSync };
