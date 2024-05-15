var constants = require('./constants.cjs');
var types = require('./types.cjs');

// Run an iterator fn for each own and inherited enumerable property in iter
// Can break iteration early by returning BREAK symbol
function forIn (iter, fn) {
    fn = types.toFn(fn);
    for (const key in iter) {
        if (fn(iter[key], key) === constants.BREAK) {
            break;
        }    }
    return iter;
}

// Run an iterator fn for each own enumerable property in iter
// Can break iteration early by returning BREAK symbol
function forOwn (iter, fn, type) {
    fn = types.toFn(fn);
    type = type || types.getType(iter);
    if (type.entries) {
        for (const [key, val] of iter.entries()) {
            if (fn(val, key, iter) === constants.BREAK) {
                break;
            }
        }
    } else if (type.iterable) {
        let index = 0;
        for (const val of iter) {
            if (fn(val, index++, iter) === constants.BREAK) {
                break;
            }
        }
    } else if (type === constants.TYPES.Object) {
        for (const [key, val] of Object.entries(iter)) {
            if (fn(val, key, iter) === constants.BREAK) {
                break;
            }
        }
    }
    return iter;
}

// Run an iterator fn for each item in iter
// Defers to forEach method
// Can break iteration early by returning BREAK symbol
function forEach(iter, fn) {
    fn = types.toFn(fn);
    if (types.hasForEach(iter)) {
        try {
            iter.forEach((val, idx, iter) => {
                if (fn(val, idx, iter) === constants.BREAK) {
                    throw constants.BREAK;
                }
            });
        } catch (err) {
            if (err !== constants.BREAK) {
                throw err;
            }
        }
    } else {
        fn(iter, 0, iter);
    }
}

function toArrayOrSelf (arr, self) {
    if (types.isArray(arr)) {
        return arr;
    }
    if (types.isIterable(arr)) {
        return Array.from(arr);
    }
    return self ? arr : [arr];
}

// Return an array from one or more objects
// If multiple objects are passed they are concatenated into one array
// If an object is iterable it is merged into the array
function toArray (...args) {
    if (args.length === 1) {
        return toArrayOrSelf(args.pop());
    } else {
        return Array.prototype.concat.call([], ...args.map(arr => {
            return toArrayOrSelf(arr, true);
        }));
    }
}

// Return a flat array
function flat (...args) {
    return toArray(...args).flat(Infinity);
}

// Return a compact array (null and undefined removed)
function compact (...args) {
    return toArray(...args).filter(types.notNil);
}

// Return a flat and compact array
function flatCompact (...args) {
    return flat(...args).filter(types.notNil);
}

function concat (...args) {
    return Array.prototype.concat.call([], ...args);
}

// Run an iterator fn for each item in iterable
// Iterates as collection, can disable by setting col to false
// Can break iteration early by returning BREAK symbol
function iterate (iter, fn, col=1) {
    let type = types.getType(iter);
    if (col && !type.collection) {
        types.toFn(fn)(iter, 0, iter);
    } else {
        if (type.entries || type.iterable || (!col && type === constants.TYPES.Object)) {
            forOwn(iter, fn, type);
        } else {
            types.toFn(fn)(iter, 0, iter);
        }
    }
}

// Run an iterator fn for each item in iterable
// Accepts optional return function, value filter, and return filter
// Note: Return function and filter functions are not validated
// Can break iteration early by returning BREAK symbol
function iterateF (iter, fn, col, retFn, valFltr, retFltr) {
    fn = types.toFn(fn);
    iterate(iter, (val, key, iter) => {
        let ret;
        if (valFltr) {
            if (valFltr(val)) {
                ret = fn(val, key, iter);
            } else {
                return;
            }
        } else {
            ret = fn(val, key, iter);
        }
        if (ret === constants.BREAK) {
            return ret;
        }
        if (retFltr) {
            if (retFltr(ret)) {
                return retFn ? retFn(ret, val, key) : ret;
            }
        } else {
            return retFn ? retFn(ret, val, key) : ret;
        }
    }, col);
}

// Run an iterator fn for each item in iter
function each (iter, fn, col) {
    iterate(iter, fn, col);
}

// Alias for each (ignores null and undefined)
function eachNotNil (iter, fn, col) {
    iterateF(iter, fn, col, undefined, types.notNil);
}

// Return a new array of return values from an iterator fn
function map (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, ret => {
        res.push(ret);
    });
    return res;
}

// Alias for map (ignores null and undefined)
function mapNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, ret => {
        res.push(ret);
    }, types.notNil, types.notNil);
    return res;
}

// Run an iterator fn for each item in iter, return new array with original values
function tap (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        res.push(val);
    });
    return res;
}

// Alias for tap (ignores null and undefined)
function tapNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        res.push(val);
    }, types.notNil);
    return res;
}

// Return true if iterator fn returns truthy for any item in iter
function some (iter, fn, col) {
    let res = 0;
    iterateF(iter, fn, col, ret => {
        if (ret) {
            res = 1;
            return constants.BREAK;
        }
    });
    return !!res;
}

// Alias for some (ignores null and undefined)
function someNotNil (iter, fn, col) {
    let res = 0;
    iterateF(iter, fn, col, ret => {
        if (ret) {
            res = 1;
            return constants.BREAK;
        }
    }, types.notNil, types.notNil);
    return !!res;
}

// Return true if iterator fn returns truthy for all items in iter
function every (iter, fn, col) {
    let res = 1;
    iterateF(iter, fn, col, ret => {
        if (!ret) {
            res = 0;
            return constants.BREAK;
        }
    });
    return !!res;
}

// Alias for every (ignores null and undefined)
function everyNotNil (iter, fn, col) {
    let res = 1;
    iterateF(iter, fn, col, ret => {
        if (!ret) {
            res = 0;
            return constants.BREAK;
        }
    }, types.notNil, types.notNil);
    return !!res;
}

// Return new array with items that iterator fn returns truthy for
function filter (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (ret) {
            res.push(val);
        }
    });
    return res;
}

// Alias for filter (ignores null and undefined)
function filterNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (ret) {
            res.push(val);
        }
    }, types.notNil, types.notNil);
    return res;
}

// Return new array with items that iterator fn returns falsy for
function remove (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (!ret) {
            res.push(val);
        }
    });
    return res;
}

// Alias for remove (ignores null and undefined)
function removeNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (!ret) {
            res.push(val);
        }
    }, types.notNil, types.notNil);
    return res;
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
    function iterate (res, obj, def) {
        forOwn(obj, (val, key) => {
            if (constants.hasOwn(def, key)) {
                if (types.isObject(def[key])) {
                    res[key] = iterate(types.toObject(res[key]), val, def[key]);
                } else {
                    if (!constants.hasOwn(res, key) || (types.isNil(res[key]) && types.notNil(val))) {
                        res[key] = val;
                    }
                }
            }
        });
        return res;
    }
    each(args, obj => {
        iterate(acc, obj, def);
    });
    return acc;
}

// Assign values from multiple sources to res
// Source properties that resolve to nil are ignored if res value already exists
// Note: if res is not an object it is converted to one if possible
function assign (res, ...args) {
    res = types.toObject(res);
    let def = types.isBoolean(args.at(-1)) ? args.pop() : false;
    eachNotNil(args, src => {
        forOwn(src, (val, key) => {
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
    eachNotNil(args, src => {
        forOwn(src, (val, key) => {
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
    forOwn(obj, val => {
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
        return everyNotNil(types.toPath(path), key => {
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
        let found = everyNotNil(types.toPath(path), key => {
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
        each(types.toPath(path), (key, index, arr) => {
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

function join (obj, sep) {
    if (types.notNil(obj)) {
        return Array.prototype.join.call(obj, toString(sep));
    }
    return '';
}

exports.assign = assign;
exports.compact = compact;
exports.concat = concat;
exports.defaults = defaults;
exports.each = each;
exports.eachNotNil = eachNotNil;
exports.every = every;
exports.everyNotNil = everyNotNil;
exports.filter = filter;
exports.filterNotNil = filterNotNil;
exports.flat = flat;
exports.flatCompact = flatCompact;
exports.forEach = forEach;
exports.forIn = forIn;
exports.forOwn = forOwn;
exports.freeze = freeze;
exports.get = get;
exports.getOwn = getOwn;
exports.has = has;
exports.iterate = iterate;
exports.iterateF = iterateF;
exports.join = join;
exports.keys = keys;
exports.map = map;
exports.mapNotNil = mapNotNil;
exports.merge = merge;
exports.remove = remove;
exports.removeNotNil = removeNotNil;
exports.set = set;
exports.setOwn = setOwn;
exports.some = some;
exports.someNotNil = someNotNil;
exports.tap = tap;
exports.tapNotNil = tapNotNil;
exports.toArray = toArray;
