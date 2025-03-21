import { argv } from '../polyfill/qjs/process.js';
import { REGEX } from './constants.js';
import { each, forOwn } from './iterate.js';
import { isArray, toNativeType, isObject } from './types.js';
import { split, toCamelCase, getOwn } from './util.js';
import { hasOwn } from '../types/base.js';

// Parse argv
// Accepts an array or string of arguments
// Supports negation, camel casing, and type casting to native types
// Note: Use quotes for param values with whitespace
// Note: Either quote style can be used, but mixing quote styles isn't supported
function parseArgv (arr=argv.slice(2), { negate=1, camel=0, native=1, sub='sub' }={}) {
    if (!isArray(arr)) {
        arr = split(arr, REGEX.whitespace, { trim: true, quotes: true, extract: true });
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
            let [k, v] = split(arg.slice(2), '=', { limit: 1, trim: true, quotes: true, extract: true });
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
            let [k, v] = split(arg.slice(1), '=', { limit: 1, trim: true, quotes: true, extract: true });
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
function optsFromArgv (opts, { argv: argv$1=argv.slice(2), ...params }={}) {
    let res = {};
    let src;
    if (isObject(argv$1)) {
        src = argv$1;
    } else {
        src = parseArgv(argv$1, params);
    }
    forOwn(opts, (alias, key) => {
        res[key] = getOwn(src, alias) ?? src[key];
    });
    return res;
}

export { argv as ARGV, parseArgv as argv, optsFromArgv, parseArgv };
