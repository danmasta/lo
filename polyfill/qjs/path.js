import { platform } from 'qjs:os';
import { each } from '../../lib/iterate.js';
import { split } from '../../lib/util.js';
import { cwd } from './process.js';

// Values: linux, darwin, win32, js
export const win32 = platform === 'win32';
export const sep = win32 ? '\\' : '/';
export const regex = /[\\/]+/g;

export function isAbsolute (path='') {
    if (win32) {
        return /^([A-Z]:[\\/]|[\\/])/.test(path);
    }
    return path[0] === sep;
}

function isRoot (str='') {
    if (win32) {
        return str === sep || /^([A-Z]:)/.test(str);
    }
    return str === sep;
}

export function getParts (...paths) {
    let root = '';
    let arr = [];
    each(paths, path => {
        let abs = isAbsolute(path);
        let parts = split(path, regex);
        if (abs) {
            if (win32 && isRoot(parts[0])) {
                root = parts.shift();
            } else {
                root = sep;
            }
            arr = parts;
        } else {
            arr.push(...parts);
        }
    });
    return [root, arr];
}

function getPartsWithCwd (...paths) {
    paths.unshift(cwd());
    return getParts(paths);
}

// Not implemented yet
export function relative () {

}

export function dirname (path) {
    return parse(path).dir;
}

export function basename (path) {
    return parse(path).base;
}

export function extname (path) {
    return parse(path).ext;
}

export function normalize (path='') {
    let parts = getParts(path);
    let root = '';
    let res = [];
    each(parts, (str, i) => {
        if (!i && isRoot(str)) {
            root = str;
        } else {
            if (str === '..') {
                if (!root || res.length) {
                    res.push(str)
                } else {
                    res.pop();
                }
            } else {
                if (str !== '.') {
                    res.push(str);
                }
            }
        }
    });
    return root + res.join(sep);
}

export function join (...paths) {
    return paths.join(sep).replace(regex, sep);
}

export function resolve (...paths) {
    let [root, arr] = getPartsWithCwd(...paths);
}

export function parse (path) {
    let [root, arr] = getParts(path);
    let base = arr.pop();
    let dir = root + root ? sep : '' + arr.join(sep);
    let name = '';
    let ext = '';
    let i = base.lastIndexOf('.');
    if (i > 0) {
        name = base.slice(0, i);
        ext = base.slice(i);
    } else {
        name = base;
    }
    return { root, dir, base, name, ext };
}

export function format ({ root='', dir='', base='', name='', ext='' }={}) {
    return root + dir + base + name + ext;
}

export default {
    sep,
    isAbsolute,
    relative,
    dirname,
    basename,
    extname,
    normalize,
    join,
    resolve,
    parse,
    format
};
