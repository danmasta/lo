import { platform } from 'qjs:os';
import { each } from '../../lib/iterate.js';
import { split } from '../../lib/util.js';
import { cwd } from './process.js';

// Values: linux, darwin, win32, js
const win32 = platform === 'win32';
const sep = win32 ? '\\' : '/';
const regex = /[\\/]+/g;

function isAbsolute (path='') {
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

function getParts (...paths) {
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
function relative () {

}

function dirname (path) {
    return parse(path).dir;
}

function basename (path) {
    return parse(path).base;
}

function extname (path) {
    return parse(path).ext;
}

function normalize (path='') {
    let parts = getParts(path);
    let root = '';
    let res = [];
    each(parts, (str, i) => {
        if (!i && isRoot(str)) {
            root = str;
        } else {
            if (str === '..') {
                if (!root || res.length) {
                    res.push(str);
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

function join (...paths) {
    return paths.join(sep).replace(regex, sep);
}

function resolve (...paths) {
    getPartsWithCwd(...paths);
}

function parse (path) {
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

function format ({ root='', dir='', base='', name='', ext='' }={}) {
    return root + dir + base + name + ext;
}

var PATH = {
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

export { basename, PATH as default, dirname, extname, format, getParts, isAbsolute, join, normalize, parse, regex, relative, resolve, sep, win32 };
