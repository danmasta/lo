import { accessSync, readFileSync } from 'node:fs';
import { access, constants, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { extname, format, normalize, parse, resolve, sep } from 'node:path';
import { TYPES } from './constants.js';
import { NotFoundError, NotSupportedError, RequireAsyncError } from './errors.js';
import { someNotNil } from './iterate.js';
import { getType, isEsmMode, isNil, isString, notNil } from './types.js';

// Note: Doesn't work with directory paths
const _require = createRequire(process.cwd() + sep + '.');

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
export function resolvePath (str, dir) {
    if (str[0] === '~') {
        return normalize(path.join(homedir(), str.slice(1)));
    }
    if (dir) {
        return resolve(dir, str);
    }
    return resolve(str);
}

export async function resolvePathIfExists (str, { dir, resolve, ext }={}) {
    let path = resolvePath(str, dir);
    try {
        await access(path, constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!ext) {
                    throw new NotFoundError(path);
                }
            }
        }
        if (ext) {
            let { dir, name } = parse(path);
            let found = await someNotNil(ext, async ext => {
                let file = format({ dir, name, ext });
                try {
                    await access(file, constants.F_OK);
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

export function resolvePathIfExistsSync (str, { dir, resolve, ext }={}) {
    let path = resolvePath(str, dir);
    try {
        accessSync(path, constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!ext) {
                    throw new NotFoundError(path);
                }
            }
        }
        if (ext) {
            let { dir, name } = parse(path);
            let found = someNotNil(ext, ext => {
                let file = format({ dir, name, ext });
                try {
                    accessSync(file, constants.F_OK);
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

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
function isNilEnv (val) {
    return isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/setter for env vars
export function env (key, val) {
    if (isString(key)) {
        let cur = process.env[key];
        if (notNil(val) && isNilEnv(cur)) {
            return process.env[key] = val;
        } else {
            return cur === 'undefined' ? undefined : cur === 'null' ? null : cur;
        }
    }
    return process.env;
}

// Conditionally import or require based on esm-ness
export function importOrRequire (str, ext) {
    ext = ext || extname(str);
    switch (ext) {
        case '.js':
            if (isEsmMode()) {
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
            if (isEsmMode()) {
                return import(str, { assert: { type: 'json' } });
            } else {
                return _require(str);
            }
        case '.cjs':
            return _require(str);
        case '.mjs':
            return import(str);
        default:
            throw new NotSupportedError(str);
    }
}

// Throw error if file requires async import
// Note: Does not resolve path like regular require
export function require (str, ext) {
    ext = ext || extname(str);
    switch (ext) {
        case '.js':
        case '.json':
        case '.cjs':
            try {
                return _require(str);
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
    let ext = extname(str);
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
    let ext = extname(str);
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
