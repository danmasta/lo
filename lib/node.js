import { accessSync, mkdirSync, readFileSync } from 'node:fs';
import { access, constants as FS_CONSTANTS, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import PATH from 'node:path';
import { argv as ARGV, cwd as CWD, env as ENV } from 'node:process';
import { hasOwn, REGEX, TYPES } from './constants.js';
import { NotFoundError, NotSupportedError, RequireAsyncError } from './errors.js';
import { each, forOwn, mapNotNil, someNotNil } from './iterate.js';
import { getType, isArray, isEsmMode, isNil, toNativeType, toString } from './types.js';
import { getOwn, split, toCamelCase } from './util.js';

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

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
export function isNilEnv (val) {
    return isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/Setter for env vars
// Returns native types for primitive values
export function env (key, val) {
    switch (arguments.length) {
        case 1:
            return toNativeType(ENV[key]);
        case 2:
            let v = ENV[key];
            if (isNilEnv(v)) {
                return ENV[key] = val;
            }
            return toNativeType(v);
        default:
            return ENV;
    }
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
        await access(path, FS_CONSTANTS.F_OK);
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
                    await access(file, FS_CONSTANTS.F_OK);
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
        accessSync(path, FS_CONSTANTS.F_OK);
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
                    accessSync(file, FS_CONSTANTS.F_OK);
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
            if (isEsmMode()) {
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
            if (isEsmMode()) {
                return import(str, { assert: { type: 'json' } });
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
            path = resolveIfExistsSync(str, { dir, exts });
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

export function mkdirp (str, mode) {
    let dir = resolve(toString(str));
    return mkdir(dir, { recursive: true, mode });
}

export function mkdirpSync (str, mode) {
    let dir = resolve(toString(str));
    return mkdirSync(dir, { recursive: true, mode });
}

// Parse argv
// Accepts an array or string of arguments
// Supports negation, camel casing, and type casting to native types
export function argv (arr, { negate=1, camel=0, native=1, sub='sub' }={}) {
    if (!isArray(arr)) {
        arr = split(arr, REGEX.whitespace);
    }
    let res = { _: [] };
    let skip = 0;
    let ref = res;
    function add (k, v) {
        if (camel) {
            k = toCamelCase(k);
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
            let [k, v] = split(arg.slice(2), '=', { limit: 1, trim: true });
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
            let [k, v] = split(arg.slice(1), '=', { limit: 1, trim: true });
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
            ref._.push(arg);
        }
    });
    return res;
}

// Return an options object from argv
// Accepts an object of key/alias pairs to match values from
export function optsFromArgv (opts, { args=ARGV.slice(2), ...params }={}) {
    let res = {};
    let src = argv(args, params);
    forOwn(opts, (alias, key) => {
        res[key] = getOwn(src, alias) ?? src[key];
    });
    return res;
}

export {
    ARGV,
    CWD, ENV, argv as parseArgv
};
