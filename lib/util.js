import { BREAK, TYPES, noop, hasOwn } from './constants.js';
import { isObject, isIterable, notNil, isArray, hasForEach, getType, isUndefined, toFn, toObject, isNil, toPath, isNumeric, isBoolean } from './types.js';
export { hasOwn } from './constants.js';

// Run an iterator fn for each own and inherited enumerable property in iter
// Can break iteration early by returning BREAK symbol
export function forIn (iter, fn) {
    fn = toFn(fn);
    for (const key in iter) {
        if (fn(iter[key], key) === BREAK) {
            break;
        };
    }
    return iter;
}

// Run an iterator fn for each own enumerable property in iter
// Can break iteration early by returning BREAK symbol
export function forOwn (iter, fn, type) {
    fn = toFn(fn);
    type = type || getType(iter);
    if (type.entries) {
        for (const [key, val] of iter.entries()) {
            if (fn(val, key, iter) === BREAK) {
                break;
            }
        }
    } else if (type.iterable) {
        let index = 0;
        for (const val of iter) {
            if (fn(val, index++, iter) === BREAK) {
                break;
            }
        }
    } else if (type === TYPES.Object) {
        for (const [key, val] of Object.entries(iter)) {
            if (fn(val, key, iter) === BREAK) {
                break;
            }
        }
    }
    return iter;
}

// Run an iterator fn for each item in iter
// Defers to forEach method
// Can break iteration early by returning BREAK symbol
export function forEach(iter, fn) {
    fn = toFn(fn);
    if (hasForEach(iter)) {
        try {
            iter.forEach((val, idx, iter) => {
                if (fn(val, idx, iter) === BREAK) {
                    throw BREAK;
                }
            });
        } catch (err) {
            if (err !== BREAK) {
                throw err;
            }
        }
    } else {
        fn(iter, 0, iter);
    }
}

function toArrayOrSelf (arr, self) {
    if (isArray(arr)) {
        return arr;
    }
    if (isIterable(arr)) {
        return Array.from(arr);
    }
    return self ? arr : [arr];
}

// Return an array from one or more objects
// If multiple objects are passed they are concatenated into one array
// If an object is iterable it is merged into the array
export function toArray (...args) {
    if (args.length === 1) {
        return toArrayOrSelf(args.pop());
    } else {
        return Array.prototype.concat.call([], ...args.map(arr => {
            return toArrayOrSelf(arr, true);
        }));
    }
}

// Return a flat array
export function flat (...args) {
    return toArray(...args).flat(Infinity);
}

// Return a compact array (null and undefined removed)
export function compact (...args) {
    return toArray(...args).filter(notNil);
}

// Return a flat and compact array
export function flatCompact (...args) {
    return flat(...args).filter(notNil);
}

export function concat (...args) {
    return Array.prototype.concat.call([], ...args);
}

// Run an iterator fn for each item in iterable
// Iterates as collection, can disable by setting col to false
// Can break iteration early by returning BREAK symbol
export function iterate (iter, fn, col=1) {
    let type = getType(iter);
    if (col && !type.collection) {
        toFn(fn)(iter, 0, iter);
    } else {
        if (type.entries || type.iterable || (!col && type === TYPES.Object)) {
            forOwn(iter, fn, type);
        } else {
            toFn(fn)(iter, 0, iter);
        }
    }
}

// Run an iterator fn for each item in iterable
// Accepts optional return function, value filter, and return filter
// Note: Return function and filter functions are not validated
// Can break iteration early by returning BREAK symbol
export function iterateF (iter, fn, col, retFn, valFltr, retFltr) {
    fn = toFn(fn);
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
        if (ret === BREAK) {
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
export function each (iter, fn, col) {
    iterate(iter, fn, col);
}

// Alias for each (ignores null and undefined)
export function eachNotNil (iter, fn, col) {
    iterateF(iter, fn, col, undefined, notNil);
}

// Return a new array of return values from an iterator fn
export function map (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, ret => {
        res.push(ret);
    });
    return res;
}

// Alias for map (ignores null and undefined)
export function mapNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, ret => {
        res.push(ret);
    }, notNil, notNil);
    return res;
}

// Run an iterator fn for each item in iter, return new array with original values
export function tap (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        res.push(val);
    });
    return res;
}

// Alias for tap (ignores null and undefined)
export function tapNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        res.push(val);
    }, notNil);
    return res;
}

// Return true if iterator fn returns truthy for any item in iter
export function some (iter, fn, col) {
    let res = 0;
    iterateF(iter, fn, col, ret => {
        if (ret) {
            res = 1;
            return BREAK;
        }
    });
    return !!res;
}

// Alias for some (ignores null and undefined)
export function someNotNil (iter, fn, col) {
    let res = 0;
    iterateF(iter, fn, col, ret => {
        if (ret) {
            res = 1;
            return BREAK;
        }
    }, notNil, notNil);
    return !!res;
}

// Return true if iterator fn returns truthy for all items in iter
export function every (iter, fn, col) {
    let res = 1;
    iterateF(iter, fn, col, ret => {
        if (!ret) {
            res = 0;
            return BREAK;
        }
    });
    return !!res;
}

// Alias for every (ignores null and undefined)
export function everyNotNil (iter, fn, col) {
    let res = 1;
    iterateF(iter, fn, col, ret => {
        if (!ret) {
            res = 0;
            return BREAK;
        }
    }, notNil, notNil);
    return !!res;
}

// Return new array with items that iterator fn returns truthy for
export function filter (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (ret) {
            res.push(val);
        }
    });
    return res;
}

// Alias for filter (ignores null and undefined)
export function filterNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (ret) {
            res.push(val);
        }
    }, notNil, notNil);
    return res;
}

// Return new array with items that iterator fn returns falsy for
export function remove (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (!ret) {
            res.push(val);
        }
    });
    return res;
}

// Alias for remove (ignores null and undefined)
export function removeNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        if (!ret) {
            res.push(val);
        }
    }, notNil, notNil);
    return res;
}

// Recursively assign properties from sources to new object
// Does not override previously set values
// Uses final argument as default definition to 'pick' properties from
// Works for all iterables and objects
// Definition must be an object or iterable that implements entries
export function defaults (...args) {
    args = compact(args);
    let acc = {};
    let def = toObject(args.at(-1));
    function iterate (res, obj, def) {
        forOwn(obj, (val, key) => {
            if (hasOwn(def, key)) {
                if (isObject(def[key])) {
                    res[key] = iterate(toObject(res[key]), val, def[key]);
                } else {
                    if (!hasOwn(res, key) || (isNil(res[key]) && notNil(val))) {
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
export function assign (res, ...args) {
    res = toObject(res);
    let def = isBoolean(args.at(-1)) ? args.pop() : false;
    eachNotNil(args, src => {
        forOwn(src, (val, key) => {
            if (!hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (notNil(val) && (!def || isNil(res[key]))) {
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
export function merge (res, ...args) {
    res = toObject(res);
    let def = isBoolean(args.at(-1)) ? args.pop() : false;
    eachNotNil(args, src => {
        forOwn(src, (val, key) => {
            if (!hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (isObject(res[key]) && isObject(val)) {
                    res[key] = merge(res[key], val);
                } else {
                    if (notNil(val) && (!def || isNil(res[key]))) {
                        res[key] = val;
                    }
                }
            }
        });
    });
    return res;
}

// Recursively freeze an object to become immutable
export function freeze (obj, recurse=1, cache) {
    // Prevent circular reference errors
    cache = cache || new Set();
    forOwn(obj, val => {
        if ((isObject(val) || isArray(val)) && recurse && !cache.has(val)) {
            cache.add(val);
            freeze(val, recurse, cache);
        }
    });
    return Object.freeze(obj);
}

export function getOwn (obj, key) {
    if (notNil(obj) && hasOwn(obj, key)) {
        return obj[key];
    }
}

export function setOwn (obj, key, val) {
    if (notNil(obj)) {
        return obj[key] = val;
    }
}

export function has (obj, path) {
    if (notNil(obj)) {
        return everyNotNil(toPath(path), key => {
            if (hasOwn(obj, key)) {
                obj = obj[key];
            } else {
                return false;
            }
        });
    }
    return false;
}

export function get (obj, path, def) {
    if (notNil(obj)) {
        let found = everyNotNil(toPath(path), key => {
            if (!hasOwn(obj, key)) {
                return false;
            } else {
                obj = obj[key];
            }
        });
        if (!found || isNil(obj)) {
            return def;
        }
        return obj;
    }
}

export function set (obj, path, val) {
    let cur = obj;
    if (isObject(obj) || isArray(obj)) {
        each(toPath(path), (key, index, arr) => {
            if (index === arr.length - 1) {
                cur[key] = val;
            } else {
                if (hasOwn(cur, key)) {
                    if (isObject(cur[key])) {
                        cur = cur[key];
                    } else {
                        if (isNumeric(arr[index + 1])) {
                            cur = cur[key] = isArray(cur[key]) ? cur[key] : [];
                        } else {
                            cur = cur[key] = {};
                        }
                    }
                } else {
                    cur = cur[key] = isNumeric(arr[index + 1]) ? [] : {};
                }
            }
        });
    }
    return obj;
}

export function keys (obj) {
    if (notNil(obj)) {
        return Object.keys(obj);
    }
    return [];
}

export function join (obj, sep) {
    if (notNil(obj)) {
        return Array.prototype.join.call(obj, toString(sep));
    }
    return '';
}
