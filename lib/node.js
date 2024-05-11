import { TYPES } from './constants.js';
import { getType } from './types.js';
import { resolve, normalize } from 'path';
import { homedir } from 'os';

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

// Resolve file path with support for home char and parent dir
export function resolvePath (str, dir) {
    if (str[0] === '~') {
        return normalize(path.join(homedir(), str.slice(1)));
    } else {
        if (dir) {
            return resolve(dir, str);
        } else {
            return resolve(str);
        }
    }
}
