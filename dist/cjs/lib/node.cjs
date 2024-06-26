var node_fs = require('node:fs');
var promises = require('node:fs/promises');
var node_module = require('node:module');
var node_os = require('node:os');
var node_path = require('node:path');
var node_process = require('node:process');
var constants = require('./constants.cjs');
var errors = require('./errors.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');

// Note: Doesn't work with directory paths
const _require = node_module.createRequire(node_process.cwd() + node_path.sep + '.');

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

// Getter/setter for env vars
function env (key, val) {
    if (types.isString(key)) {
        let curr = node_process.env[key];
        if (types.notNil(val) && isNilEnv(curr)) {
            return node_process.env[key] = val;
        } else {
            return curr === 'undefined' ? undefined : curr === 'null' ? null : curr;
        }
    }
    return node_process.env;
}

// Resolve file path with support for home char or parent dir
function resolvePath (str, dir) {
    if (str[0] === '~') {
        return node_path.normalize(path.join(node_os.homedir(), str.slice(1)));
    }
    if (dir) {
        return node_path.resolve(dir, str);
    }
    return node_path.resolve(str);
}

async function resolvePathIfExists (str, { dir, resolve, exts }={}) {
    let path = resolvePath(str, dir);
    try {
        await promises.access(path, promises.constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new errors.NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: _ext } = node_path.parse(path);
            let found = await iterate.someNotNil(exts, async ext => {
                if (ext === _ext) {
                    return false;
                }
                let file = node_path.format({ dir, name, ext });
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

function resolvePathIfExistsSync (str, { dir, resolve, exts }={}) {
    let path = resolvePath(str, dir);
    try {
        node_fs.accessSync(path, promises.constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new errors.NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: _ext } = node_path.parse(path);
            let found = iterate.someNotNil(exts, ext => {
                if (ext === _ext) {
                    return false;
                }
                let file = node_path.format({ dir, name, ext });
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
    ext = ext || node_path.extname(str);
    switch (ext) {
        case '.js':
            if (types.isEsmMode()) {
                return import(str);
            } else {
                try {
                    return _require(str);
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
                return _require(str);
            }
        case '.cjs':
            return _require(str);
        case '.mjs':
            return import(str);
        default:
            throw new errors.NotSupportedError(str);
    }
}

// Throw error if file requires async import
// Note: Does not resolve path like regular require
function require$1 (str, ext) {
    ext = ext || node_path.extname(str);
    switch (ext) {
        case '.js':
        case '.json':
        case '.cjs':
            try {
                return _require(str);
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
    let ext = node_path.extname(str);
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
    let ext = node_path.extname(str);
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
            path = await resolvePathIfExists(str, { dir, exts });
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
            error
        }
    });
}

function readFilesSync (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return iterate.mapNotNil(paths, str => {
        let path, contents, error;
        try {
            path = resolvePathIfExistsSync(str, { dir, exts });
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
            error
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

exports.env = env;
exports.importOrRequire = importOrRequire;
exports.importOrRequireFiles = importOrRequireFiles;
exports.importRequireOrRead = importRequireOrRead;
exports.importRequireOrReadFiles = importRequireOrReadFiles;
exports.isDuplex = isDuplex;
exports.isPassThrough = isPassThrough;
exports.isReadable = isReadable;
exports.isStream = isStream;
exports.isTransform = isTransform;
exports.isWritable = isWritable;
exports.readFiles = readFiles;
exports.readFilesSync = readFilesSync;
exports.require = require$1;
exports.requireFiles = requireFiles;
exports.requireOrReadFilesSync = requireOrReadFilesSync;
exports.requireOrReadSync = requireOrReadSync;
exports.resolvePath = resolvePath;
exports.resolvePathIfExists = resolvePathIfExists;
exports.resolvePathIfExistsSync = resolvePathIfExistsSync;
