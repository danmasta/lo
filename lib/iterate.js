import { BREAK } from './constants.js';
import { getType, hasForEach, notNil, toFn } from './types.js';

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
export function forEach (iter, fn) {
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
