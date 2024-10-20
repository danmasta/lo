var node_fs = require('node:fs');
var promises = require('node:fs/promises');
var node_module = require('node:module');
var node_os = require('node:os');
var PATH = require('node:path');
var node_process = require('node:process');
var constants = require('./constants.cjs');
var errors = require('./errors.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');
var util = require('./util.cjs');

// Note: Resolves relative to CWD
// Note: Doesn't work with directory paths
const REQUIRE = node_module.createRequire(node_process.cwd() + PATH.sep + '.');

function isBuffer (obj) {
    return types.getType(obj) === constants.TYPES.Buffer;
}

function isStream (obj) {
    return obj instanceof constants.TYPES.Stream.ctor;
}

function isReadable (obj) {
    return types.getType(obj) === constants.TYPES.Readable;
}

function isWritable (obj) {
    return types.getType(obj) === constants.TYPES.Writable;
}

function isTransform (obj) {
    return types.getType(obj) === constants.TYPES.Transform;
}

function isDuplex (obj) {
    return types.getType(obj) === constants.TYPES.Duplex;
}

function isPassThrough (obj) {
    return types.getType(obj) === constants.TYPES.PassThrough;
}

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
function isNilEnv (val) {
    return types.isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/Setter for env vars
// Returns native types for primitive values
function env (key, val) {
    switch (arguments.length) {
        case 1:
            return types.toNativeType(node_process.env[key]);
        case 2:
            let v = node_process.env[key];
            if (isNilEnv(v)) {
                return node_process.env[key] = val;
            }
            return types.toNativeType(v);
        default:
            return node_process.env;
    }
}

// Resolve file path with support for home char or parent dir
function resolve (str, dir) {
    if (str[0] === '~') {
        return PATH.join(node_os.homedir(), str.slice(1));
    }
    if (dir) {
        return PATH.resolve(dir, str);
    }
    return PATH.resolve(str);
}

async function resolveIfExists (str, { dir, require, exts }={}) {
    let path = resolve(str, dir);
    try {
        await promises.access(path, promises.constants.F_OK);
        return path;
    } catch (err) {
        if (require) {
            try {
                return REQUIRE.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new errors.NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: EXT } = PATH.parse(path);
            let found = await iterate.someNotNil(exts, async ext => {
                if (ext === EXT) {
                    return false;
                }
                let file = PATH.format({ dir, name, ext });
                try {
                    await promises.access(file, promises.constants.F_OK);
                    path = file;
                    return true;
                } catch (err) {
                    return false;
                }
            });
            if (found) {
                return path;
            } else {
                throw new errors.NotFoundError(path);
            }
        } else {
            throw new errors.NotFoundError(path);
        }
    }
}

function resolveIfExistsSync (str, { dir, require, exts }={}) {
    let path = resolve(str, dir);
    try {
        node_fs.accessSync(path, promises.constants.F_OK);
        return path;
    } catch (err) {
        if (require) {
            try {
                return REQUIRE.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new errors.NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: EXT } = PATH.parse(path);
            let found = iterate.someNotNil(exts, ext => {
                if (ext === EXT) {
                    return false;
                }
                let file = PATH.format({ dir, name, ext });
                try {
                    node_fs.accessSync(file, promises.constants.F_OK);
                    path = file;
                    return true;
                } catch (err) {
                    return false;
                }
            });
            if (found) {
                return path;
            } else {
                throw new errors.NotFoundError(path);
            }
        } else {
            throw new errors.NotFoundError(path);
        }
    }
}

// Conditionally import or require based on esm-ness
function importOrRequire (str, ext) {
    ext = ext ?? PATH.extname(str);
    switch (ext) {
        case '.js':
            if (types.isEsmMode()) {
                return import(str);
            } else {
                try {
                    return REQUIRE(str);
                } catch (err) {
                    if (err.code === 'ERR_REQUIRE_ESM' || err.code === 'ERR_REQUIRE_ASYNC_MODULE') {
                        return import(str);
                    }
                    throw err;
                }
            }
        case '.json':
            if (types.isEsmMode()) {
                return import(str);
            } else {
                return REQUIRE(str);
            }
        case '.cjs':
            return REQUIRE(str);
        case '.mjs':
            return import(str);
        default:
            throw new errors.NotSupportedError(str);
    }
}

// Throw error if file requires async import
// Note: Does not resolve path like regular require
function require$1 (str, ext) {
    ext = ext ?? PATH.extname(str);
    switch (ext) {
        case '.js':
        case '.json':
        case '.cjs':
            try {
                return REQUIRE(str);
            } catch (err) {
                if (err.code === 'ERR_REQUIRE_ESM' || err.code === 'ERR_REQUIRE_ASYNC_MODULE') {
                    throw new errors.RequireAsyncError(str);
                }
                throw err;
            }
        case '.mjs':
            throw new errors.RequireAsyncError(str);
        default:
            throw new errors.NotSupportedError(str);
    }
}

async function importRequireOrRead (str, encoding='utf8') {
    let ext = PATH.extname(str);
    switch (ext) {
        case '.js':
        case '.json':
        case '.cjs':
        case '.mjs':
            return await importOrRequire(str, ext);
        default:
            return await promises.readFile(str, { encoding });
    }
}

// Throw error if file requires async import
function requireOrReadSync (str, encoding='utf8') {
    let ext = PATH.extname(str);
    switch (ext) {
        case '.js':
        case '.json':
        case '.cjs':
        case '.mjs':
            return require$1(str, ext);
        default:
            return node_fs.readFileSync(str, { encoding });
    }
}

async function readFiles (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return await iterate.mapNotNil(paths, async str => {
        let path, contents, error;
        try {
            path = await resolveIfExists(str, { dir, exts });
            switch (fn) {
                case importOrRequire:
                    contents = await fn(path);
                    break;
                case importRequireOrRead:
                    contents = await fn(path, encoding);
                    break;
                default:
                    contents = await promises.readFile(path, { encoding });
            }
        } catch (err) {
            error = err;
        }
        return {
            path,
            original: str,
            contents,
            err: error
        }
    });
}

function readFilesSync (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return iterate.mapNotNil(paths, str => {
        let path, contents, error;
        try {
            path = resolveIfExistsSync(str, { dir, exts });
            switch (fn) {
                case require$1:
                    contents = fn(path);
                    break;
                case requireOrReadSync:
                    contents = fn(path, encoding);
                    break;
                default:
                    contents = node_fs.readFileSync(path, { encoding });
            }
        } catch (err) {
            error = err;
        }
        return {
            path,
            original: str,
            contents,
            err: error
        }
    });
}

async function importOrRequireFiles (paths, args) {
    return readFiles(paths, { ...args, fn: importOrRequire });
}

async function importRequireOrReadFiles (paths, args) {
    return readFiles(paths, { ...args, fn: importRequireOrRead });
}

function requireFiles (paths, args) {
    return readFilesSync(paths, { ...args, fn: require$1 });
}

function requireOrReadFilesSync (paths, args) {
    return readFilesSync(paths, { ...args, fn: requireOrReadSync });
}

function mkdirp (str, mode) {
    let dir = resolve(types.toString(str));
    return promises.mkdir(dir, { recursive: true, mode });
}

function mkdirpSync (str, mode) {
    let dir = resolve(types.toString(str));
    return node_fs.mkdirSync(dir, { recursive: true, mode });
}

// Parse argv
// Accepts an array or string of arguments
// Supports negation, camel casing, and type casting to native types
// Note: Use quotes for param values with whitespace
// Either quote style can be used, but it has to be consistent
// Note: mixing quote style isn't supported
function argv (arr, { negate=1, camel=0, native=1, sub='sub' }={}) {
    if (!types.isArray(arr)) {
        arr = util.split(arr, constants.REGEX.whitespace, { trim: true, quotes: true, extract: true });
    }
    let res = { _: [] };
    let skip = 0;
    let ref = res;
    function add (k, v) {
        if (camel) {
            k = util.toCamelCase(k);
        }
        if (native) {
            v = types.toNativeType(v);
        }
        if (constants.hasOwn(ref, k)) {
            if (!types.isArray(ref[k])) {
                ref[k] = [ref[k]];
            }
            ref[k].push(v);
        } else {
            ref[k] = v;
        }
    }
    function isOpt (str='') {
        return str.startsWith('--') || str.startsWith('-');
    }
    function isAlphabetical (p) {
        return (p >= 65 && p <= 90) || (p >= 97 && p <= 122);
    }
    iterate.each(arr, (arg, i, args) => {
        if (skip) {
            skip = 0;
            return;
        }
        if (arg === '--') {
            if (sub) {
                ref = ref[sub] = { _: [] };
            }
            return;
        }
        if (arg === '-') {
            ref['-'] = true;
            return;
        }
        if (arg.startsWith('--')) {
            let [k, v] = util.split(arg.slice(2), '=', { limit: 1, trim: true, quotes: true, extract: true });
            if (v) {
                add(k, v);
            } else {
                let next = args.at(i + 1);
                if (next && !isOpt(next)) {
                    skip = 1;
                    add(k, next);
                } else {
                    if (negate && k.startsWith('no-')) {
                        k = k.slice(3);
                        add(k, false);
                    } else {
                        add(k, true);
                    }
                }
            }
            return;
        }
        if (arg.startsWith('-')) {
            let [k, v] = util.split(arg.slice(1), '=', { limit: 1, trim: true, quotes: true, extract: true });
            if (v) {
                add(k, v);
                return;
            } else {
                k = arg.slice(1, 2);
                v = arg.slice(2);
            }
            if (v) {
                if (!isAlphabetical(v.codePointAt(0))) {
                    add(k, v);
                } else {
                    add(k, true);
                    for (const char of v) {
                        add(char, true);
                    }
                }
            } else {
                let next = args.at(i + 1);
                if (next && !isOpt(next)) {
                    skip = 1;
                    add(k, next);
                } else {
                    add(k, true);
                }
            }
            return;
        }
        if (arg) {
            if (native) {
                arg = types.toNativeType(arg);
            }
            ref._.push(arg);
        }
    });
    return res;
}

// Return an options object from argv
// Accepts an object of key/alias pairs to match values from
function optsFromArgv (opts, { args=node_process.argv.slice(2), ...params }={}) {
    let res = {};
    let src = argv(args, params);
    iterate.forOwn(opts, (alias, key) => {
        res[key] = util.getOwn(src, alias) ?? src[key];
    });
    return res;
}

Object.defineProperty(exports, "ARGV", {
    enumerable: true,
    get: function () { return node_process.argv; }
});
Object.defineProperty(exports, "CWD", {
    enumerable: true,
    get: function () { return node_process.cwd; }
});
Object.defineProperty(exports, "ENV", {
    enumerable: true,
    get: function () { return node_process.env; }
});
exports.argv = argv;
exports.env = env;
exports.importOrRequire = importOrRequire;
exports.importOrRequireFiles = importOrRequireFiles;
exports.importRequireOrRead = importRequireOrRead;
exports.importRequireOrReadFiles = importRequireOrReadFiles;
exports.isBuffer = isBuffer;
exports.isDuplex = isDuplex;
exports.isNilEnv = isNilEnv;
exports.isPassThrough = isPassThrough;
exports.isReadable = isReadable;
exports.isStream = isStream;
exports.isTransform = isTransform;
exports.isWritable = isWritable;
exports.mkdirp = mkdirp;
exports.mkdirpSync = mkdirpSync;
exports.optsFromArgv = optsFromArgv;
exports.parseArgv = argv;
exports.readFiles = readFiles;
exports.readFilesSync = readFilesSync;
exports.require = require$1;
exports.requireFiles = requireFiles;
exports.requireOrReadFilesSync = requireOrReadFilesSync;
exports.requireOrReadSync = requireOrReadSync;
exports.resolve = resolve;
exports.resolveIfExists = resolveIfExists;
exports.resolveIfExistsSync = resolveIfExistsSync;
