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

async function resolvePathIfExists (str, { dir, resolve, ext }={}) {
    let path = resolvePath(str, dir);
    try {
        await promises.access(path, promises.constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!ext) {
                    throw new errors.NotFoundError(path);
                }
            }
        }
        if (ext) {
            let { dir, name } = node_path.parse(path);
            let found = await iterate.someNotNil(ext, async ext => {
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

function resolvePathIfExistsSync (str, { dir, resolve, ext }={}) {
    let path = resolvePath(str, dir);
    try {
        node_fs.accessSync(path, promises.constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!ext) {
                    throw new errors.NotFoundError(path);
                }
            }
        }
        if (ext) {
            let { dir, name } = node_path.parse(path);
            let found = iterate.someNotNil(ext, ext => {
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

// If a value was never set on _env it will return typeof undefined
// If a value was set on _env that was typeof undefined it will become string 'undefined'
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

exports.env = env;
exports.importOrRequire = importOrRequire;
exports.importRequireOrRead = importRequireOrRead;
exports.isDuplex = isDuplex;
exports.isPassThrough = isPassThrough;
exports.isReadable = isReadable;
exports.isStream = isStream;
exports.isTransform = isTransform;
exports.isWritable = isWritable;
exports.require = require$1;
exports.requireOrReadSync = requireOrReadSync;
exports.resolvePath = resolvePath;
exports.resolvePathIfExists = resolvePathIfExists;
exports.resolvePathIfExistsSync = resolvePathIfExistsSync;
