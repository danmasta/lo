import { identity, BREAK } from './constants.js';
import { getType, isIterable, isAsyncIterable, isAsyncFunction, toFn, notNil, isFunction, hasForEach } from './types.js';

// Async alias
async function forInA (obj, fn=identity) {
    for (const key in obj) {
        if (await fn(obj[key], key, obj) === BREAK) {
            break;
        }    }
    return obj;
}

// Run an iterator fn for each own and inherited enumerable property in obj
// Note: Can break iteration early by returning BREAK symbol
function forIn (obj, fn=identity) {
    if (isAsyncFunction(fn)) {
        return forInA(obj, fn);
    }
    fn = toFn(fn);
    for (const key in obj) {
        if (fn(obj[key], key, obj) === BREAK) {
            break;
        }    }
    return obj;
}

// Run an iterator fn for each own enumerable property in obj
// Note: Can break iteration early by returning BREAK symbol
function forOwn (obj, fn) {
    return compose(obj, fn, 0);
}

// Run an iterator fn for each item in obj
// Defers to object's own forEach method if exists
// Note: Can break iteration early by returning BREAK symbol
function forEach (obj, fn=identity) {
    fn = toFn(fn);
    if (hasForEach(obj)) {
        try {
            obj.forEach((val, idx, obj) => {
                if (fn(val, idx, obj) === BREAK) {
                    throw BREAK;
                }
            });
        } catch (err) {
            if (err !== BREAK) {
                throw err;
            }
        }
    } else {
        fn(obj, 0, obj);
    }
}

// Async alias
async function iterateA (obj, fn=identity, col=1, type, iter, iterA, fnA) {
    if (notNil(obj)) {
        if (col && !type.collection && !type.object) {
            await fn(obj, 0, obj);
        } else {
            if (iterA) {
                let index = 0;
                for await (const val of obj) {
                    if (await fn(val, index++, obj) === BREAK) {
                        break;
                    }
                }
            } else if (type.entries) {
                for (const [key, val] of obj.entries()) {
                    if (await fn(val, key, obj) === BREAK) {
                        break;
                    }
                }
            } else if (iter) {
                let index = 0;
                for (const val of obj) {
                    if (await fn(val, index++, obj) === BREAK) {
                        break;
                    }
                }
            } else if (!col && type.object) {
                for (const [key, val] of Object.entries(obj)) {
                    if (await fn(val, key, obj) === BREAK) {
                        break;
                    }
                }
            } else {
                await fn(obj, 0, obj);
            }
        }
    }
    return obj;
}

// Run an iterator fn for each item in obj
// Iterates as collection by default, can disable by passing col=false
// Note: Can break iteration early by returning BREAK symbol
function iterate (obj, fn=identity, col=1, type, iter) {
    if (notNil(obj)) {
        if (col && !type.collection && !type.object) {
            fn(obj, 0, obj);
        } else {
            if (type.entries) {
                for (const [key, val] of obj.entries()) {
                    if (fn(val, key, obj) === BREAK) {
                        break;
                    }
                }
            } else if (iter) {
                let index = 0;
                for (const val of obj) {
                    if (fn(val, index++, obj) === BREAK) {
                        break;
                    }
                }
            } else if (!col && type.object) {
                for (const [key, val] of Object.entries(obj)) {
                    if (fn(val, key, obj) === BREAK) {
                        break;
                    }
                }
            } else {
                fn(obj, 0, obj);
            }
        }
    }
    return obj;
}

// Async alias
async function iterateFA (obj, fn=identity, col, retFn, res, valFltr, retFltr, type, iter, iterA, fnA) {
    await iterateA(obj, async (val, key, obj) => {
        let ret;
        if (valFltr) {
            if (valFltr(val)) {
                ret = await fn(val, key, obj);
            } else {
                return;
            }
        } else {
            ret = await fn(val, key, obj);
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
    }, col, type, iter, iterA);
    return isFunction(res) ? res() : res;
}

// Run an iterator fn for each item in obj with filters
// Accepts optional return function, return value, value filter, and return value filter
// Note: Useful for composing other types of iteration methods
// Note: Return function, value filter, and return filter are not validated
// Note: Can break iteration early by returning BREAK symbol
function iterateF (obj, fn=identity, col, retFn, res, valFltr, retFltr, type, iter) {
    iterate(obj, (val, key, obj) => {
        let ret;
        if (valFltr) {
            if (valFltr(val)) {
                ret = fn(val, key, obj);
            } else {
                return;
            }
        } else {
            ret = fn(val, key, obj);
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
    }, col, type, iter);
    return isFunction(res) ? res() : res;
}

// Determine whether to iterate sync or async
function isAsync (iter, iterA, fnA) {
    if (iterA) {
        if (fnA) {
            return true;
        } else {
            if (iter) {
                return false;
            }
        }
        return true;
    }
    if (fnA) {
        return true;
    }
    return false;
}

// Compose iteration method
// Note: Checks type info
// Returns sync or async based on obj and fn types
function compose (obj, fn, col=1) {
    let type = getType(obj);
    let iter = isIterable(obj);
    let iterA = isAsyncIterable(obj);
    let fnA = isAsyncFunction(fn);
    let async = isAsync(iter, iterA, fnA);
    fn = toFn(fn, identity);
    if (async) {
        return iterateA(obj, fn, col, type, iter, iterA);
    }
    return iterate(obj, fn, col, type, iter);
}

// Compose iteration method with filters
// Note: Checks type info
// Returns sync or async based on obj and fn types
function composeF (obj, fn, col=1, retFn, res, valFltr, retFltr) {
    let type = getType(obj);
    let iter = isIterable(obj);
    let iterA = isAsyncIterable(obj);
    let fnA = isAsyncFunction(fn);
    let async = isAsync(iter, iterA, fnA);
    fn = toFn(fn, identity);
    if (async) {
        return iterateFA(obj, fn, col, retFn, res, valFltr, retFltr, type, iter, iterA);
    }
    return iterateF(obj, fn, col, retFn, res, valFltr, retFltr, type, iter);
}

// Run an iterator fn for each item in obj
function each (obj, fn, col) {
    return compose(obj, fn, col);
}

// Alias for each (ignores null and undefined)
function eachNotNil (obj, fn, col) {
    return composeF(obj, fn, col, undefined, obj, notNil);
}

function mapFn (res, ret) {
    res.push(ret);
}

// Return a new array of return values from iterator fn
function map (obj, fn, col) {
    return composeF(obj, fn, col, mapFn, []);
}

// Alias for map (ignores null and undefined)
function mapNotNil (obj, fn, col) {
    return composeF(obj, fn, col, mapFn, [], notNil, notNil);
}

function tapFn (res, ret, val) {
    res.push(val);
}

// Run an iterator fn for each item in obj, return new array with original values
function tap (obj, fn, col) {
    return composeF(obj, fn, col, tapFn, []);
}

// Alias for tap (ignores null and undefined)
function tapNotNil (obj, fn, col) {
    return composeF(obj, fn, col, tapFn, [], notNil);
}

// Getter/Setter for response values that can't be passed by reference
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

// Return true if iterator fn returns truthy for any item in obj
function some (obj, fn, col) {
    return composeF(obj, fn, col, someFn, resFn(false));
}

// Alias for some (ignores null and undefined)
function someNotNil (obj, fn, col) {
    return composeF(obj, fn, col, someFn, resFn(false), notNil, notNil);
}

function everyFn (res, ret) {
    if (!ret) {
        res(false);
        return BREAK;
    }
}

// Return true if iterator fn returns truthy for all items in obj
function every (obj, fn, col) {
    return composeF(obj, fn, col, everyFn, resFn(true));
}

// Alias for every (ignores null and undefined)
function everyNotNil (obj, fn, col) {
    return composeF(obj, fn, col, everyFn, resFn(true), notNil, notNil);
}

function filterFn (res, ret, val) {
    if (ret) {
        res.push(val);
    }
}

// Return new array with items that iterator fn returns truthy for
function filter (obj, fn, col) {
    return composeF(obj, fn, col, filterFn, []);
}

// Alias for filter (ignores null and undefined)
function filterNotNil (obj, fn, col) {
    return composeF(obj, fn, col, filterFn, [], notNil, notNil);
}

function removeFn (res, ret, val) {
    if (!ret) {
        res.push(val);
    }
}

// Return new array with items that iterator fn returns falsy for
function remove (obj, fn, col) {
    return composeF(obj, fn, col, removeFn, []);
}

// Alias for remove (ignores null and undefined)
function removeNotNil (obj, fn, col) {
    return composeF(obj, fn, col, removeFn, [], notNil, notNil);
}

// -1 or Infinity to drop all
function dropFn (num=0) {
    return function (res, ret, val) {
        if (num) {
            num--;
        } else {
            res.push(val);
        }
    }
}

// Return new array with n items dropped from head
function drop (obj, num, col) {
    return composeF(obj, undefined, col, dropFn(num), []);
}

// Alias for drop (ignores null and undefined)
function dropNotNil (obj, num, col) {
    return composeF(obj, undefined, col, dropFn(num), [], notNil, notNil);
}

// -1 or Infinity to take all
function takeFn (num=-1) {
    return function (res, ret, val) {
        if (num) {
            res.push(val);
            num--;
        } else {
            return BREAK;
        }
    }
}

// Return new array with n number of items from head
function take (obj, num, col) {
    return composeF(obj, undefined, col, takeFn(num), []);
}

// Alias for take (ignores null and undefined)
function takeNotNil (obj, num, col) {
    return composeF(obj, undefined, col, takeFn(num), [], notNil, notNil);
}

function findFn (res, ret, val) {
    if (ret) {
        res(val);
        return BREAK;
    }
}

// Return first item that iterator fn returns truthy for
function find (obj, fn, col) {
    return composeF(obj, fn, col, findFn, resFn());
}

// Alias for find (ignores null and undefined)
function findNotNil (obj, fn, col) {
    return composeF(obj, fn, col, findFn, resFn(), notNil, notNil);
}

export { drop, dropNotNil, each, eachNotNil, every, everyNotNil, filter, filterNotNil, find, findNotNil, forEach, forIn, forOwn, compose as iterate, composeF as iterateF, map, mapNotNil, remove, removeNotNil, some, someNotNil, take, takeNotNil, tap, tapNotNil };
