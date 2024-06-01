import { BREAK, TYPES } from './constants.js';
import { getType, hasForEach, isAsyncFunction, isAsyncIterable, isFunction, notNil, toFn } from './types.js';

// Async alias
async function forInA (iter, fn) {
    for (const key in iter) {
        if (await fn(iter[key], key, iter) === BREAK) {
            break;
        };
    }
    return iter;
}

// Run an iterator fn for each own and inherited enumerable property in iter
// Note: Can break iteration early by returning BREAK symbol
export function forIn (iter, fn) {
    if (isAsyncFunction(fn)) {
        return forInA(iter, fn);
    }
    fn = toFn(fn);
    for (const key in iter) {
        if (fn(iter[key], key, iter) === BREAK) {
            break;
        };
    }
    return iter;
}

// Run an iterator fn for each item in iter
// Note: Can break iteration early by returning BREAK symbol
export function forOwn (iter, fn) {
    return compose(iter, fn, 0);
}

// Run an iterator fn for each item in iter
// Defers to forEach method
// Note: Can break iteration early by returning BREAK symbol
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

// Async alias
async function iterateA (iter, fn, col=1, type, iterA, fnA) {
    if (col && !type.collection) {
        await fn(iter, 0, iter);
    } else {
        if (iterA) {
            let index = 0;
            for await (const val of iter) {
                if (await fn(val, index++, iter) === BREAK) {
                    break;
                }
            }
        } else if (type.entries) {
            for (const [key, val] of iter.entries()) {
                if (await fn(val, key, iter) === BREAK) {
                    break;
                }
            }
        } else if (type.iterable) {
            let index = 0;
            for (const val of iter) {
                if (await fn(val, index++, iter) === BREAK) {
                    break;
                }
            }
        } else if (!col && type === TYPES.Object) {
            for (const [key, val] of Object.entries(iter)) {
                if (await fn(val, key, iter) === BREAK) {
                    break;
                }
            }
        } else {
            await fn(iter, 0, iter);
        }
    }
    return iter;
}

// Run an iterator fn for each item in iter
// Iterates as collection, can disable by setting col to false
// Note: Can break iteration early by returning BREAK symbol
function iterate (iter, fn, col=1, type) {
    if (col && !type.collection) {
        fn(iter, 0, iter);
    } else {
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
        } else if (!col && type === TYPES.Object) {
            for (const [key, val] of Object.entries(iter)) {
                if (fn(val, key, iter) === BREAK) {
                    break;
                }
            }
        } else {
            fn(iter, 0, iter);
        }
    }
    return iter;
}

// Async alias
async function iterateFA (iter, fn, col, retFn, res, valFltr, retFltr, type, iterA, fnA) {
    await iterateA(iter, async (val, key, iter) => {
        let ret;
        if (valFltr) {
            if (valFltr(val)) {
                ret = await fn(val, key, iter);
            } else {
                return;
            }
        } else {
            ret = await fn(val, key, iter);
        }
        if (ret === BREAK) {
            return ret;
        }
        if (retFltr) {
            if (retFltr(ret)) {
                return retFn ? retFn(res, ret, val, key) : ret;
            } else {
                return;
            }
        } else {
            return retFn ? retFn(res, ret, val, key) : ret;
        }
    }, col, type, iterA, fnA);
    return isFunction(res) ? res() : res;
}

// Run an iterator fn for each item in iter with filters
// Accepts optional return function, return value, value filter, and return value filter
// Note: Useful for composing other types of iteration methods
// Note: Return function and filter functions are not validated
// Note: Can break iteration early by returning BREAK symbol
function iterateF (iter, fn, col, retFn, res, valFltr, retFltr, type) {
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
                return retFn ? retFn(res, ret, val, key) : ret;
            } else {
                return;
            }
        } else {
            return retFn ? retFn(res, ret, val, key) : ret;
        }
    }, col, type);
    return isFunction(res) ? res() : res;
}

// Compose iteration method
// Checks type info
// Returns sync or async based on iterable and iterator fn types
function compose (iter, fn, col=1) {
    let type = getType(iter);
    let iterA = type.async || isAsyncIterable(iter);
    let fnA = isAsyncFunction(fn);
    fn = toFn(fn);
    if (iterA || fnA) {
        return iterateA(iter, fn, col, type, iterA, fnA);
    }
    return iterate(iter, fn, col, type);
}

// Compose iteration method with filters
// Checks type info
// Returns sync or async based on iterable and iterator fn types
function composeF (iter, fn, col=1, retFn, res, valFltr, retFltr) {
    let type = getType(iter);
    let iterA = type.async || isAsyncIterable(iter);
    let fnA = isAsyncFunction(fn);
    fn = toFn(fn);
    if (iterA || fnA) {
        return iterateFA(iter, fn, col, retFn, res, valFltr, retFltr, type, iterA, fnA);
    }
    return iterateF(iter, fn, col, retFn, res, valFltr, retFltr, type);
}

// Run an iterator fn for each item in iter
export function each (iter, fn, col) {
    return compose(iter, fn, col);
}

// Alias for each (ignores null and undefined)
export function eachNotNil (iter, fn, col) {
    return composeF(iter, fn, col, undefined, iter, notNil);
}

function mapFn (res, ret) {
    res.push(ret);
}

// Return a new array of return values from iterator fn
export function map (iter, fn, col) {
    return composeF(iter, fn, col, mapFn, []);
}

// Alias for map (ignores null and undefined)
export function mapNotNil (iter, fn, col) {
    return composeF(iter, fn, col, mapFn, [], notNil, notNil);
}

function tapFn (res, ret, val) {
    res.push(val);
}

// Run an iterator fn for each item in iter, return new array with original values
export function tap (iter, fn, col) {
    return composeF(iter, fn, col, tapFn, []);
}

// Alias for tap (ignores null and undefined)
export function tapNotNil (iter, fn, col) {
    return composeF(iter, fn, col, tapFn, [], notNil);
}

// Getter/setter for response values that can't be passed by reference
function resFn (res) {
    return val => {
        if (notNil(val)) {
            res = val;
        } else {
            return res;
        }
    }
}

function someFn (res, ret) {
    if (ret) {
        res(true);
        return BREAK;
    }
}

// Return true if iterator fn returns truthy for any item in iter
export function some (iter, fn, col) {
    return composeF(iter, fn, col, someFn, resFn(false));
}

// Alias for some (ignores null and undefined)
export function someNotNil (iter, fn, col) {
    return composeF(iter, fn, col, someFn, resFn(false), notNil, notNil);
}

function everyFn (res, ret) {
    if (!ret) {
        res(false);
        return BREAK;
    }
}

// Return true if iterator fn returns truthy for all items in iter
export function every (iter, fn, col) {
    return composeF(iter, fn, col, everyFn, resFn(true));
}

// Alias for every (ignores null and undefined)
export function everyNotNil (iter, fn, col) {
    return composeF(iter, fn, col, everyFn, resFn(true), notNil, notNil);
}

function filterFn (res, ret, val) {
    if (ret) {
        res.push(val);
    }
}

// Return new array with items that iterator fn returns truthy for
export function filter (iter, fn, col) {
    return composeF(iter, fn, col, filterFn, []);
}

// Alias for filter (ignores null and undefined)
export function filterNotNil (iter, fn, col) {
    return composeF(iter, fn, col, filterFn, [], notNil, notNil);
}

function removeFn (res, ret, val) {
    if (!ret) {
        res.push(val);
    }
}

// Return new array with items that iterator fn returns falsy for
export function remove (iter, fn, col) {
    return composeF(iter, fn, col, removeFn, []);
}

// Alias for remove (ignores null and undefined)
export function removeNotNil (iter, fn, col) {
    return composeF(iter, fn, col, removeFn, [], notNil, notNil);
}

export {
    compose as iterate,
    composeF as iterateF
};
