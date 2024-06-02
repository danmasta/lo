import { accessSync } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { format, normalize, parse, resolve } from 'node:path';
import { TYPES } from './constants.js';
import { NotFoundError } from './errors.js';
import { someNotNil } from './iterate.js';
import { getType, isNil, isString, notNil } from './types.js';

const require = createRequire(import.meta.url);

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
                return require.resolve(path);
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
                return require.resolve(path);
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
