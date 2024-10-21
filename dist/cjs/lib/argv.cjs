var node_process = require('node:process');
var constants = require('./constants.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');
var util = require('./util.cjs');
var base = require('../types/base.cjs');

// Parse argv
// Accepts an array or string of arguments
// Supports negation, camel casing, and type casting to native types
// Note: Use quotes for param values with whitespace
// Note: Either quote style can be used, but mixing quote styles isn't supported
function argv (arr, { negate=1, camel=0, native=1, sub='sub' }={}) {
    if (!types.isArray(arr)) {
        arr = util.split(arr, constants.REGEX.whitespace, { trim: true, quotes: true, extract: true });
    }
    let res = { _: [] };
    let skip = 0;
    let ref = res;
    function add (k, v) {
        if (camel) {
            k = util.toCamelCase(k);
        }
        if (native) {
            v = types.toNativeType(v);
        }
        if (base.hasOwn(ref, k)) {
            if (!types.isArray(ref[k])) {
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
    iterate.each(arr, (arg, i, args) => {
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
            let [k, v] = util.split(arg.slice(2), '=', { limit: 1, trim: true, quotes: true, extract: true });
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
            let [k, v] = util.split(arg.slice(1), '=', { limit: 1, trim: true, quotes: true, extract: true });
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
                arg = types.toNativeType(arg);
            }
            ref._.push(arg);
        }
    });
    return res;
}

// Return an options object from argv
// Accepts an object of key/alias pairs to match values from
function optsFromArgv (opts, { args=node_process.argv.slice(2), ...params }={}) {
    let res = {};
    let src = argv(args, params);
    iterate.forOwn(opts, (alias, key) => {
        res[key] = util.getOwn(src, alias) ?? src[key];
    });
    return res;
}

Object.defineProperty(exports, "ARGV", {
    enumerable: true,
    get: function () { return node_process.argv; }
});
exports.argv = argv;
exports.optsFromArgv = optsFromArgv;
exports.parseArgv = argv;
