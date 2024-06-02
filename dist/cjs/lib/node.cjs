var node_fs = require('node:fs');
var promises = require('node:fs/promises');
var node_module = require('node:module');
var node_os = require('node:os');
var node_path = require('node:path');
var constants = require('./constants.cjs');
var errors = require('./errors.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
const require$1 = node_module.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.src || new URL('lib/node.cjs', document.baseURI).href)));

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
                return require$1.resolve(path);
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
                return require$1.resolve(path);
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

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
function isNilEnv (val) {
    return types.isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/setter for env vars
function env (key, val) {
    if (types.isString(key)) {
        let cur = process.env[key];
        if (types.notNil(val) && isNilEnv(cur)) {
            return process.env[key] = val;
        } else {
            return cur === 'undefined' ? undefined : cur === 'null' ? null : cur;
        }
    }
    return process.env;
}

exports.env = env;
exports.isDuplex = isDuplex;
exports.isPassThrough = isPassThrough;
exports.isReadable = isReadable;
exports.isStream = isStream;
exports.isTransform = isTransform;
exports.isWritable = isWritable;
exports.resolvePath = resolvePath;
exports.resolvePathIfExists = resolvePathIfExists;
exports.resolvePathIfExistsSync = resolvePathIfExistsSync;
