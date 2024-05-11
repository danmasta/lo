import { BREAK, TYPES, noop, hasOwn } from './constants.js';
import { isObject, isIterable, isNotNil, isArray, hasForEach, getType, isUndefined, toFn, toObject } from './types.js';

// Run an iterator fn for each own and inherited enumerable property in obj
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

// Run an iterator fn for each own enumerable property in obj
// Can break iteration early by returning BREAK symbol
export function forOwn (iter, fn) {
    let type = this ? this : getType(iter);
    fn = toFn(fn);
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
    return toArray(...args).filter(isNotNil);
}

// Return a flat and compact array
export function flatCompact (...args) {
    return flat(...args).filter(isNotNil);
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
            forOwn.call(type, iter, fn);
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

// Run an iterator fn for each item in iter (ignores null and undefined)
export function eachNotNil (iter, fn, col) {
    iterateF(iter, fn, col, undefined, isNotNil);
}

// Return a new array of return values from an iterator fn
export function map (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, ret => {
        res.push(ret);
    });
    return res;
}

// Return a new array of return values from an iterator fn (ignores null and undefined)
export function mapNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, ret => {
        res.push(ret);
    }, isNotNil, isNotNil);
    return res;
}

export function tap (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        res.push(val);
    });
    return res;
}

export function tapNotNil (iter, fn, col) {
    let res = [];
    iterateF(iter, fn, col, (ret, val) => {
        res.push(val);
    }, isNotNil);
    return res;
}

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

export function someNotNil (iter, fn, col) {
    let res = 0;
    iterateF(iter, fn, col, ret => {
        if (ret) {
            res = 1;
            return BREAK;
        }
    }, isNotNil, isNotNil);
    return !!res;
}

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

export function everyNotNil (iter, fn, col) {
    let res = 1;
    iterateF(iter, fn, col, ret => {
        if (!ret) {
            res = 0;
            return BREAK;
        }
    }, isNotNil, isNotNil);
    return !!res;
}

// Recursively assigns properties from sources to new object
// Uses final argument as default option set to pick propertiess from
export function defaults (...args) {
    let acc = {};
    function iterate (res, obj, def) {
        forOwn(obj, (val, key) => {
            if (hasOwn(def, key)) {
                if (isObject(def[key])) {
                    res[key] = iterate(toObject(res[key]), val, def[key]);
                } else {
                    if (isUndefined(res[key])) {
                        res[key] = val;
                    }
                }
            }
        });
        return res;
    }
    args.map(obj => {
        iterate(acc, obj, args.at(-1));
    });
    return acc;
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

// Aliases
export {

};
