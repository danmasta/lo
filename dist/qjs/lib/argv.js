import { resolve } from '../polyfill/base/path.js';
import '../polyfill/base/process.js';
import { REGEX, hasOwn } from './constants.js';
import { each, forOwn } from './iterate.js';
import { isObject, isArray, toNativeType } from './types.js';
import { split, toCamelCase, getOwn } from './util.js';
import { argv } from '../polyfill/qjs/core.js';

// Note: Argv1 is not always a script file path
// Node script: [argv0, path, ...]
// Node REPL: [argv0, ...]
// QJS script: [argv0, path, ...]
// QJS standalone: [argv0, ...]
// QJS REPL: [argv0, ...]

// Note: Argv1 in node can be incorrect when executing from a relative path
// Eg: (node bin/cmd)
// Argv1 is resolved using path.resolve:
// https://github.com/nodejs/node/blob/d89657c29e69043289ae0f75d87cca634d396bff/lib/internal/process/pre_execution.js#L239
// Which is then passed to the loader
// which uses the cjs resolve mechanism to load the actual file
// But argv1 is not updated with the resolved file path:
// https://github.com/nodejs/node/blob/d89657c29e69043289ae0f75d87cca634d396bff/lib/internal/main/run_main_module.js#L33

// Parse argv
// Accepts an array or string of arguments
// Supports negation, camel casing, and type casting to native types
// Note: Use quotes for argument values with whitespace
// Note: Either quote style can be used, but mixing quote styles isn't supported
// Normalize checks if first argument is a file path, then removes
function parseArgv (argv$1, opts) {
    if (isObject(argv$1)) {
        [argv$1, opts] = [opts, argv$1];
    }
    let { negate=1, camel=1, native=1, sub='sub', normalize=0 } = opts ??= {};
    argv$1 ??= argv.slice(normalize ? 1 : 2);
    if (!isArray(argv$1)) {
        argv$1 = split(argv$1, REGEX.whitespace, { trim: true, quotes: true, extract: true });
    }
    if (normalize) {
        if (argv$1[0] && argv$1[0] === resolve(argv$1[0])) {
            argv$1.shift();
        }
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
    each(argv$1, (arg, i, args) => {
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
function optsFromArgv (opts, { argv, ...params }={}) {
    let res = {};
    let src;
    if (isObject(argv)) {
        src = argv;
    } else {
        src = parseArgv(argv, params);
    }
    forOwn(opts, (alias, key) => {
        res[key] = getOwn(src, alias) ?? src[key];
    });
    return res;
}

export { argv as ARGV, parseArgv as argv, optsFromArgv, parseArgv };
