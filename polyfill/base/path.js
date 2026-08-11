import { each } from '#lib/iterate';
import { toLower } from '#lib/util';
import { cwd, isWin32 } from '#polyfill/core';

function createPath (sep, delimiter, win32) {

    // Extract the root prefix of a path and the offset where segments begin
    function getRoot (path='') {
        if (win32) {
            // Note: UNC share (\\server\share)
            let unc = /^[\\/]{2}([^\\/]+)[\\/]+([^\\/]+)/.exec(path);
            if (unc) {
                return [sep + sep + unc[1] + sep + unc[2] + sep, unc[0].length];
            }
            // Note: Drive with separator (C:\)
            let drive = /^([a-zA-Z]:)[\\/]/.exec(path);
            if (drive) {
                return [drive[1] + sep, drive[0].length];
            }
            // Note: Leading separator (relative to the current drive)
            if (/^[\\/]/.test(path)) {
                return [sep, 1];
            }
        } else {
            // Posix
            if (path[0] === sep) {
                return [sep, 1];
            }
        }
        // Note: Relative (no root)
        return ['', 0];
    }

    // Check if character is a path separator
    function isSep (char) {
        return char === '/' || (win32 && char === '\\');
    }

    // Index of the next separator at or after `index`, or -1
    // Note: Posix only supports one separator, win32 supports two
    function nextSep (str, index) {
        let i = str.indexOf('/', index);
        if (win32) {
            let j = str.indexOf('\\', index);
            if (i < 0) {
                return j;
            }
            if (j < 0) {
                return i;
            }
            return i < j ? i : j;
        }
        return i;
    }

    // Call fn for each non-empty segment in `str` from `index`
    // Note: Uses native indexOf to find separators instead of scanning every char
    function eachSegment (str, index, fn) {
        let n = str.length;
        let i = index;
        while (i < n) {
            let next = nextSep(str, i);
            if (next < 0) {
                fn(str.slice(i));
                break;
            }
            if (next > i) {
                fn(str.slice(i, next));
            }
            i = next + 1;
        }
    }

    // Compare path segments (case-insensitive for win32, matches node)
    function eq (a, b) {
        if (win32) {
            return toLower(a) === toLower(b);
        }
        return a === b;
    }

    function getParts (...paths) {
        let root = '';
        let segs = [];
        each(paths, path => {
            let [head, index] = getRoot(path);
            if (head) {
                root = head;
                segs = [];
            }
            eachSegment(path, index, seg => {
                segs.push(seg);
            });
        });
        return [root, segs];
    }

    function getPartsWithCwd (...paths) {
        paths.unshift(cwd());
        return getParts(...paths);
    }

    // Fold path segments onto a stack (resolving '.' and '..')
    // Note: With root, '..' can't escape (without root, leading '..' are kept)
    function fold (segs, root) {
        let res = [];
        each(segs, str => {
            switch (str) {
                case '.':
                    break;
                case '..':
                    if (root || res.length && res.at(-1) !== '..') {
                        res.pop();
                    } else {
                        res.push('..');
                    }
                    break;
                default:
                    res.push(str);
            }
        });
        return res;
    }

    // Check if path string is absolute
    function isAbsolute (path='') {
        if (win32) {
            return /^(?:[a-zA-Z]:[\\/]|[\\/])/.test(path);
        }
        return path[0] === sep;
    }

    // Returns the relative path of `from` to `to`
    // Note: Both paths are resolved to absolute against CWD first
    function relative (from, to) {
        from = resolve(from);
        to = resolve(to);
        if (from === to) {
            return '';
        }
        let [rootFrom, segsFrom] = getParts(from);
        let [rootTo, segsTo] = getParts(to);
        // Note: Different roots can't be made relative (different win32 drives)
        if (!eq(rootFrom, rootTo)) {
            return to;
        }
        // Note: Skip common leading segments
        let len = Math.min(segsFrom.length, segsTo.length);
        let i = 0;
        while (i < len && eq(segsFrom[i], segsTo[i])) {
            i++;
        }
        // Note: Walk up out of remaining `from` segments and down into `to`
        let res = [];
        each(segsFrom.slice(i), () => {
            res.push('..');
        });
        each(segsTo.slice(i), str => {
            res.push(str);
        });
        return res.join(sep);
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

    // Normalize path (resolve '.' and '..' segments)
    // Note: Trailing separator is preserved (matches node)
    function normalize (path='') {
        if (!path) {
            return '.';
        }
        let [root, segs] = getParts(path);
        let res = fold(segs, root);
        let trail = isSep(path.at(-1));
        let str = res.join(sep);
        if (!str) {
            return root || (trail ? '.' + sep : '.');
        }
        return root + str + (trail ? sep : '');
    }

    // Join all path segments with sep and normalize
    function join (...paths) {
        return normalize(paths.join(sep));
    }

    // Resolve sequence of paths or segments to absolute path
    function resolve (...paths) {
        let [root, segs] = getPartsWithCwd(...paths);
        return root + fold(segs, root).join(sep);
    }

    // Parse path string to path object of significant parts
    function parse (path='') {
        let [root, segs] = getParts(path);
        let base = segs.pop() ?? '';
        let dir = root + segs.join(sep);
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

    return {
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
        getParts,
        getPartsWithCwd
    };

}

export const posix = createPath('/', ':', false);
export const win32 = createPath('\\', ';', true);

posix.posix = posix;
posix.win32 = win32;
win32.posix = posix;
win32.win32 = win32;

const def = isWin32 ? win32 : posix;

export const {
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
    getParts,
    getPartsWithCwd
} = def;

export default def;
