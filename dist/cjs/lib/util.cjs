var constants = require('./constants.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');

// Return a flat array
function flat (...args) {
    return types.toArray(...args).flat(Infinity);
}

// Return a compact array (null and undefined removed)
function compact (...args) {
    return types.toArray(...args).filter(types.notNil);
}

// Return a flat and compact array
function flatCompact (...args) {
    return flat(...args).filter(types.notNil);
}

function concat (...args) {
    return Array.prototype.concat.call([], ...args);
}

// Recursively assign properties from sources to new object
// Does not override previously set values
// Uses final argument as default definition to 'pick' properties from
// Works for all iterables and objects
// Definition must be an object or iterable that implements entries
function defaults (...args) {
    args = compact(args);
    let acc = {};
    let def = types.toObject(args.at(-1));
    function iterate$1 (res, obj, def) {
        iterate.forOwn(obj, (val, key) => {
            if (constants.hasOwn(def, key)) {
                if (types.isObject(def[key])) {
                    res[key] = iterate$1(types.toObject(res[key]), val, def[key]);
                } else {
                    if (!constants.hasOwn(res, key) || (types.isNil(res[key]) && types.notNil(val))) {
                        res[key] = val;
                    }
                }
            }
        });
        return res;
    }
    iterate.each(args, obj => {
        iterate$1(acc, obj, def);
    });
    return acc;
}

// Assign values from multiple sources to res
// Source properties that resolve to nil are ignored if res value already exists
// Note: if res is not an object it is converted to one if possible
function assign (res, ...args) {
    res = types.toObject(res);
    let def = types.isBoolean(args.at(-1)) ? args.pop() : false;
    iterate.eachNotNil(args, src => {
        iterate.forOwn(src, (val, key) => {
            if (!constants.hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (types.notNil(val) && (!def || types.isNil(res[key]))) {
                    res[key] = val;
                }
            }
        });
    });
    return res;
}

// Recursively assign values from multiple sources to res
// Source properties that resolve to nil are ignored if res value already exists
// Note: if res is not an object it is converted to one if possible
// Note: arrays are not merged
function merge (res, ...args) {
    res = types.toObject(res);
    let def = types.isBoolean(args.at(-1)) ? args.pop() : false;
    iterate.eachNotNil(args, src => {
        iterate.forOwn(src, (val, key) => {
            if (!constants.hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (types.isObject(res[key]) && types.isObject(val)) {
                    res[key] = merge(res[key], val);
                } else {
                    if (types.notNil(val) && (!def || types.isNil(res[key]))) {
                        res[key] = val;
                    }
                }
            }
        });
    });
    return res;
}

// Recursively freeze an object to become immutable
function freeze (obj, recurse=1, cache) {
    // Prevent circular reference errors
    cache = cache || new Set();
    iterate.forOwn(obj, val => {
        if ((types.isObject(val) || types.isArray(val)) && recurse && !cache.has(val)) {
            cache.add(val);
            freeze(val, recurse, cache);
        }
    });
    return Object.freeze(obj);
}

function getOwn (obj, key) {
    if (types.notNil(obj) && constants.hasOwn(obj, key)) {
        return obj[key];
    }
}

function setOwn (obj, key, val) {
    if (types.notNil(obj)) {
        return obj[key] = val;
    }
}

function has (obj, path) {
    if (types.notNil(obj)) {
        return iterate.everyNotNil(types.toPath(path), key => {
            if (constants.hasOwn(obj, key)) {
                obj = obj[key];
            } else {
                return false;
            }
        });
    }
    return false;
}

function get (obj, path, def) {
    if (types.notNil(obj)) {
        let found = iterate.everyNotNil(types.toPath(path), key => {
            if (!constants.hasOwn(obj, key)) {
                return false;
            } else {
                obj = obj[key];
            }
        });
        if (!found || types.isNil(obj)) {
            return def;
        }
        return obj;
    }
}

function set (obj, path, val) {
    let cur = obj;
    if (types.isObject(obj) || types.isArray(obj)) {
        iterate.each(types.toPath(path), (key, index, arr) => {
            if (index === arr.length - 1) {
                cur[key] = val;
            } else {
                if (constants.hasOwn(cur, key)) {
                    if (types.isObject(cur[key])) {
                        cur = cur[key];
                    } else {
                        if (types.isNumeric(arr[index + 1])) {
                            cur = cur[key] = types.isArray(cur[key]) ? cur[key] : [];
                        } else {
                            cur = cur[key] = {};
                        }
                    }
                } else {
                    cur = cur[key] = types.isNumeric(arr[index + 1]) ? [] : {};
                }
            }
        });
    }
    return obj;
}

function keys (obj) {
    if (types.notNil(obj)) {
        return Object.keys(obj);
    }
    return [];
}

function join (obj, sep=',') {
    if (types.notNil(obj)) {
        return Array.prototype.join.call(obj, types.toString(sep));
    }
    return '';
}

exports.hasOwn = constants.hasOwn;
exports.assign = assign;
exports.compact = compact;
exports.concat = concat;
exports.defaults = defaults;
exports.flat = flat;
exports.flatCompact = flatCompact;
exports.freeze = freeze;
exports.get = get;
exports.getOwn = getOwn;
exports.has = has;
exports.join = join;
exports.keys = keys;
exports.merge = merge;
exports.set = set;
exports.setOwn = setOwn;
