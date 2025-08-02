import { accessSync, constants, mkdirSync, promises, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import PATH from 'node:path';
import { cwd as CWD } from 'node:process';
import { TYPES } from './constants.js';
import { NotFoundError, NotSupportedError, RequireAsyncError } from './errors.js';
import { mapNotNil, someNotNil } from './iterate.js';
import { getType, isEsm, toString } from './types.js';
const { access, mkdir, readFile } = promises;
const { F_OK } = constants;

// Note: Resolves relative to CWD
// Note: Doesn't work with directory paths
const REQUIRE = createRequire(CWD() + PATH.sep + '.');

export function isBuffer (obj) {
    return getType(obj) === TYPES.Buffer;
}

export function isStream (obj) {
    return obj instanceof TYPES.Stream.ctor;
}

export function isReadable (obj) {
    return getType(obj) === TYPES.Readable;
}

export function isWritable (obj) {
    return getType(obj) === TYPES.Writable;
}

export function isTransform (obj) {
    return getType(obj) === TYPES.Transform;
}

export function isDuplex (obj) {
    return getType(obj) === TYPES.Duplex;
}

export function isPassThrough (obj) {
    return getType(obj) === TYPES.PassThrough;
}

// Resolve file path with support for home char or parent dir
export function resolve (str, dir) {
    if (str[0] === '~') {
        return PATH.join(homedir(), str.slice(1));
    }
    if (dir) {
        return PATH.resolve(dir, str);
    }
    return PATH.resolve(str);
}

export async function resolveIfExists (str, { dir, require, exts }={}) {
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

export function resolveIfExistsSync (str, { dir, require, exts }={}) {
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
export function importOrRequire (str, ext) {
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
export function require (str, ext) {
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

export async function importRequireOrRead (str, encoding='utf8') {
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
export function requireOrReadSync (str, encoding='utf8') {
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

export async function readFiles (paths, { dir, exts, fn, encoding='utf8' }={}) {
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

export function readFilesSync (paths, { dir, exts, fn, encoding='utf8' }={}) {
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

export async function importOrRequireFiles (paths, args) {
    return readFiles(paths, { ...args, fn: importOrRequire });
}

export async function importRequireOrReadFiles (paths, args) {
    return readFiles(paths, { ...args, fn: importRequireOrRead });
}

export function requireFiles (paths, args) {
    return readFilesSync(paths, { ...args, fn: require });
}

export function requireOrReadFilesSync (paths, args) {
    return readFilesSync(paths, { ...args, fn: requireOrReadSync });
}

export function mkdirp (str, mode) {
    let dir = resolve(toString(str));
    return mkdir(dir, { recursive: true, mode });
}

export function mkdirpSync (str, mode) {
    let dir = resolve(toString(str));
    return mkdirSync(dir, { recursive: true, mode });
}

export async function readJson (str, encoding='utf8') {
    return JSON.parse(await readFile(resolve(str), { encoding }));
}

export function readJsonSync (str, encoding='utf8') {
    return JSON.parse(readFileSync(resolve(str), { encoding }));
}

export {
    CWD
};
