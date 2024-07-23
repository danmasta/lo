import { accessSync, readFileSync } from 'node:fs';
import { constants as _constants, access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { extname, format, join, parse, resolve, sep } from 'node:path';
import { env as _env, cwd } from 'node:process';
import { hasOwn, REGEX, TYPES } from './constants.js';
import { NotFoundError, NotSupportedError, RequireAsyncError } from './errors.js';
import { each, mapNotNil, someNotNil } from './iterate.js';
import { getType, isArray, isEsmMode, isNil, isString, notNil, toNativeType } from './types.js';
import { split, toCamel } from './util.js';

// Note: Doesn't work with directory paths
const _require = createRequire(cwd() + sep + '.');

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

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
export function isNilEnv (val) {
    return isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/setter for env vars
export function env (key, val) {
    if (isString(key)) {
        let curr = _env[key];
        if (notNil(val) && isNilEnv(curr)) {
            return _env[key] = val;
        } else {
            return curr === 'undefined' ? undefined : curr === 'null' ? null : curr;
        }
    }
    return _env;
}

// Resolve file path with support for home char or parent dir
export function resolvePath (str, dir) {
    if (str[0] === '~') {
        return join(homedir(), str.slice(1));
    }
    if (dir) {
        return resolve(dir, str);
    }
    return resolve(str);
}

export async function resolvePathIfExists (str, { dir, resolve, exts }={}) {
    let path = resolvePath(str, dir);
    try {
        await access(path, _constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: _ext } = parse(path);
            let found = await someNotNil(exts, async ext => {
                if (ext === _ext) {
                    return false;
                }
                let file = format({ dir, name, ext });
                try {
                    await access(file, _constants.F_OK);
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

export function resolvePathIfExistsSync (str, { dir, resolve, exts }={}) {
    let path = resolvePath(str, dir);
    try {
        accessSync(path, _constants.F_OK);
        return path;
    } catch (err) {
        if (resolve) {
            try {
                return _require.resolve(path);
            } catch (err) {
                if (!exts) {
                    throw new NotFoundError(path);
                }
            }
        }
        if (exts) {
            let { dir, name, ext: _ext } = parse(path);
            let found = someNotNil(exts, ext => {
                if (ext === _ext) {
                    return false;
                }
                let file = format({ dir, name, ext });
                try {
                    accessSync(file, _constants.F_OK);
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

export async function readFiles (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return await mapNotNil(paths, async str => {
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
                    contents = await readFile(path, { encoding });
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

export function readFilesSync (paths, { dir, exts, fn, encoding='utf8' }={}) {
    return mapNotNil(paths, str => {
        let path, contents, error;
        try {
            path = resolvePathIfExistsSync(str, { dir, exts });
            switch (fn) {
                case require:
                    contents = fn(path);
                    break;
                case requireOrReadSync:
                    contents = fn(path, encoding);
                    break;
                default:
                    contents = readFileSync(path, { encoding });
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

// Parse argv
// Accepts an array or string of arguments
// Supports negation, camel casing, and type casting to native types
export function argv (arr, { negate=1, camel=1, native=1 }={}) {
    if (!isArray(arr)) {
        arr = split(arr, REGEX.whitespace);
    }
    let res = { _pos: [] };
    let skip = 0;
    let ref = res;
    function add (k, v) {
        if (camel) {
            k = toCamel(k);
        }
        if (native) {
            v = toNativeType(v);
        }
        if (hasOwn(ref, k)) {
            if (!isArray(ref[k])) {
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
    each(arr, (arg, i, args) => {
        if (skip) {
            skip = 0;
            return;
        }
        if (arg === '--') {
            ref = ref._sub = { _pos: [] };
            return;
        }
        if (arg === '-') {
            ref['-'] = true;
            return;
        }
        if (arg.startsWith('--')) {
            let { 0: k, 1: v } = split(arg.slice(2), '=', 1, true);
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
            let { 0: k, 1: v } = split(arg.slice(1), '=', 1, true);
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
                arg = toNativeType(arg);
            }
            ref._pos.push(arg);
        }
    });
    return res;
}
