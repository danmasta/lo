import { each } from '../../lib/iterate.js';
import { split } from '../../lib/util.js';
import { sep, delimiter, isWin32, cwd } from '../qjs/core.js';

const regex = /[\\/]+/g;

function isAbsolute (path='') {
    if (isWin32) {
        return /^([A-Z]:[\\/]|[\\/])/.test(path);
    }
    return path[0] === sep;
}

function isRoot (str='') {
    if (isWin32) {
        return str === sep || /^([A-Z]:)/.test(str);
    }
    return str === sep;
}

function getParts (...paths) {
    let root = '';
    let parts = [];
    each(paths, path => {
        let abs = isAbsolute(path);
        let arr = split(path, regex);
        if (abs) {
            if (isWin32 && isRoot(arr[0])) {
                root = arr.shift();
            } else {
                root = sep;
            }
            parts = arr;
        } else {
            parts.push(...arr);
        }
    });
    return [root, parts];
}

function getPartsWithCwd (...paths) {
    paths.unshift(cwd());
    return getParts(...paths);
}

// Not implemented yet
// Returns the relative path of from to to based on CWD
function relative (from, to) {

}

function dirname (path) {
    return parse(path).dir;
}

function basename (path, suf='') {
    let obj = parse(path);
    if (suf && obj.base.endsWith(suf)) {
        return obj.base.slice(0, -suf.length);
    }
    return obj.base;
}

function extname (path) {
    return parse(path).ext;
}

// Normalize path, resolve '.' and '..' segments
function normalize (path='') {
    if (!path) {
        return '.';
    }
    let [root, parts] = getParts(path);
    let res = [];
    each(parts, str => {
        switch (str) {
            case '.':
                if (!root && parts.length === 1) {
                    res.push('.');
                }
                break;
            case '..':
                if (root || res.length && res.at(-1) !== '..') {
                    res.pop();
                } else {
                    res.push(str);
                }
                break;
            default:
                res.push(str);
        }
    });
    return root + res.join(sep);
}

// Join all path segments with sep and normalize
function join (...paths) {
    return normalize(paths.join(sep));
}

// Resolve sequence of paths or segments to absolute path
function resolve (...paths) {
    let [root, parts] = getPartsWithCwd(...paths);
    let res = [];
    each(parts, str => {
        switch (str) {
            case '.':
                break;
            case '..':
                res.pop();
                break;
            default:
                res.push(str);
        }
    });
    return root + res.join(sep);
}

// Parse path string to path object of significant parts
function parse (path='') {
    let [root, parts] = getParts(path);
    let base = parts.pop();
    let dir = root + parts.join(sep);
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

// Returns a path string from a path object (parse)
function format ({ root='', dir='', base='', name='', ext='' }={}) {
    if (!base) {
        base = name + (ext[0] === '.' ? '' : '.') + ext;
    }
    if (!dir) {
        dir = root;
    }
    return dir + sep + base;
}

const posix = {
    sep: '/',
    delimiter: ':',
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

const win32 = {
    sep: '\\',
    delimiter: ';',
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

posix.posix = posix;
posix.win32 = win32;
win32.posix = posix;
win32.win32 = win32;

var PATH = {
    sep,
    delimiter,
    isAbsolute,
    relative,
    dirname,
    basename,
    extname,
    normalize,
    join,
    resolve,
    parse,
    format,
    posix,
    win32
};

export { basename, PATH as default, dirname, extname, format, getParts, getPartsWithCwd, isAbsolute, join, normalize, parse, posix, relative, resolve, win32 };
