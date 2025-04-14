import { platform } from 'qjs:os';
import { each } from '../../lib/iterate.js';
import { split } from '../../lib/util.js';
import { cwd } from './process.js';

// Note: linux, darwin, win32, or js
const win32 = platform === 'win32';
const sep = win32 ? '\\' : '/';
const delimiter = win32 ? ';' : ':';
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
    return getParts(...paths);
}

// Not implemented yet
// Returns the relative path of from to to based on CWD
function relative (from, to) {

}

function dirname (path) {
    return parse(path).dir;
}

function basename (path, ext) {
    let obj = parse(path);
    if (ext && obj.ext === ext) {
        return obj.name;
    }
    return obj.base;
}

function extname (path) {
    return parse(path).ext;
}

// Normalize path, resolve '..' and '.' segments
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
                if (root || (res.length && res.at(-1) !== '..')) {
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
    format
};

export { basename, PATH as default, delimiter, dirname, extname, format, getParts, getPartsWithCwd, isAbsolute, join, normalize, parse, regex, relative, resolve, sep, win32 };
