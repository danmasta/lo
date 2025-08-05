import { promises, constants, accessSync, readFileSync, mkdirSync } from '../polyfill/qjs/fs.js';
import { createRequire } from '../polyfill/base/module.js';
import { homedir } from '../polyfill/base/os.js';
import PATH from '../polyfill/base/path.js';
import '../polyfill/base/process.js';
import { TYPES } from './constants.js';
import { NotFoundError, NotSupportedError, RequireAsyncError } from './errors.js';
import { someNotNil, mapNotNil } from './iterate.js';
import { getType, isEsm, toString } from './types.js';
import { cwd } from '../polyfill/qjs/core.js';

const { access, mkdir, readFile } = promises;
const { F_OK } = constants;

// Note: Resolves relative to CWD
// Note: Doesn't work with directory paths
const REQUIRE = createRequire(cwd() + PATH.sep + '.');

function isBuffer (obj) {
    return getType(obj) === TYPES.Buffer;
}

function isStream (obj) {
    return obj instanceof TYPES.Stream.ctor;
}

function isReadable (obj) {
    return getType(obj) === TYPES.Readable;
}

function isWritable (obj) {
    return getType(obj) === TYPES.Writable;
}

function isTransform (obj) {
    return getType(obj) === TYPES.Transform;
}

function isDuplex (obj) {
    return getType(obj) === TYPES.Duplex;
}

function isPassThrough (obj) {
    return getType(obj) === TYPES.PassThrough;
}

// Resolve file path with support for home char or parent dir
function resolve (str, dir) {
    if (str[0] === '~') {
        return PATH.join(homedir(), str.slice(1));
    }
    if (dir) {
        return PATH.resolve(dir, str);
    }
    return PATH.resolve(str);
}

async function resolveIfExists (str, { dir, require, exts }={}) {
    let path = resolve(str, dir);
    try {
        await access(path, F_OK);
        return path;
    } catch (err) {
        if (require) {
            try {
                return REQUIRE.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: EXT } = PATH.parse(path);
            let found = await someNotNil(exts, async ext => {
                if (ext === EXT) {
                    return false;
                }
                let file = PATH.format({ dir, name, ext });
                try {
                    await access(file, F_OK);
                    path = file;
                    return true;
                } catch (err) {
                    return false;
                }
            });
            if (found) {
                return path;
            } else {
                throw new NotFoundError(path);
            }
        } else {
            throw new NotFoundError(path);
        }
    }
}

function resolveIfExistsSync (str, { dir, require, exts }={}) {
    let path = resolve(str, dir);
    try {
        accessSync(path, F_OK);
        return path;
    } catch (err) {
        if (require) {
            try {
                return REQUIRE.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: EXT } = PATH.parse(path);
            let found = someNotNil(exts, ext => {
                if (ext === EXT) {
                    return false;
                }
                let file = PATH.format({ dir, name, ext });
                try {
                    accessSync(file, F_OK);
                    path = file;
                    return true;
                } catch (err) {
                    return false;
                }
            });
            if (found) {
                return path;
            } else {
                throw new NotFoundError(path);
            }
        } else {
            throw new NotFoundError(path);
        }
    }
}

// Conditionally import or require based on esm-ness
function importOrRequire (str, ext) {
    ext = ext ?? PATH.extname(str);
    switch (ext) {
        case '.js':
            if (isEsm()) {
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
            if (isEsm()) {
                return import(str, { with: { type: 'json' } });
            } else {
                return REQUIRE(str);
            }
        case '.cjs':
            return REQUIRE(str);
        case '.mjs':
            return import(str);
        default:
            throw new NotSupportedError(str);
    }
}

// Throw error if file requires async import
// Note: Does not resolve path like regular require
function require (str, ext) {
    ext = ext ?? PATH.extname(str);
    switch (ext) {
        case '.js':
        case '.json':
        case '.cjs':
            try {
                return REQUIRE(str);
            } catch (err) {
                if (err.code === 'ERR_REQUIRE_ESM' || err.code === 'ERR_REQUIRE_ASYNC_MODULE') {
                    throw new RequireAsyncError(str);
                }
                throw err;
            }
        case '.mjs':
            throw new RequireAsyncError(str);
        default:
            throw new NotSupportedError(str);
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
            return await readFile(str, { encoding });
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
            return require(str, ext);
        default:
            return readFileSync(str, { encoding });
    }
}

async function readFiles (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return await mapNotNil(paths, async str => {
        let path, data, err;
        try {
            path = await resolveIfExists(str, { dir, exts });
            switch (fn) {
                case importOrRequire:
                    data = await fn(path);
                    break;
                case importRequireOrRead:
                    data = await fn(path, encoding);
                    break;
                default:
                    data = await readFile(path, { encoding });
            }
        } catch (e) {
            err = e;
        }
        return {
            path,
            original: str,
            data,
            err
        }
    });
}

function readFilesSync (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return mapNotNil(paths, str => {
        let path, data, err;
        try {
            path = resolveIfExistsSync(str, { dir, exts });
            switch (fn) {
                case require:
                    data = fn(path);
                    break;
                case requireOrReadSync:
                    data = fn(path, encoding);
                    break;
                default:
                    data = readFileSync(path, { encoding });
            }
        } catch (e) {
            err = e;
        }
        return {
            path,
            original: str,
            data,
            err
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
    return readFilesSync(paths, { ...args, fn: require });
}

function requireOrReadFilesSync (paths, args) {
    return readFilesSync(paths, { ...args, fn: requireOrReadSync });
}

function mkdirp (str, mode) {
    let dir = resolve(toString(str));
    return mkdir(dir, { recursive: true, mode });
}

function mkdirpSync (str, mode) {
    let dir = resolve(toString(str));
    return mkdirSync(dir, { recursive: true, mode });
}

async function readJson (str, encoding='utf8') {
    return JSON.parse(await readFile(resolve(str), { encoding }));
}

function readJsonSync (str, encoding='utf8') {
    return JSON.parse(readFileSync(resolve(str), { encoding }));
}

export { cwd as CWD, importOrRequire, importOrRequireFiles, importRequireOrRead, importRequireOrReadFiles, isBuffer, isDuplex, isPassThrough, isReadable, isStream, isTransform, isWritable, mkdirp, mkdirpSync, readFiles, readFilesSync, readJson, readJsonSync, require, requireFiles, requireOrReadFilesSync, requireOrReadSync, resolve, resolveIfExists, resolveIfExistsSync };
