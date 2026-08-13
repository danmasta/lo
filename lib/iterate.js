import { BREAK, id } from './constants.js';
import { getType, isAsyncFunction, isAsyncIterable, isFunction, isIterable, isNil, notNil, of, toFn } from './types.js';

// Async alias
async function forInA (obj, fn=id) {
    for (const key in obj) {
        if (await fn(obj[key], key, obj) === BREAK) {
            break;
        };
    }
    return obj;
}

// Run an iterator fn for each own and inherited enumerable property in obj
// Note: Can break iteration early by returning BREAK symbol
export function forIn (obj, fn=id) {
    if (isAsyncFunction(fn)) {
        return forInA(obj, fn);
    }
    fn = toFn(fn);
    for (const key in obj) {
        if (fn(obj[key], key, obj) === BREAK) {
            break;
        };
    }
    return obj;
}

// Run an iterator fn for each own enumerable property in obj
// Note: Can break iteration early by returning BREAK symbol
export function forOwn (obj, fn) {
    return compose(obj, fn, 0);
}

// Async alias
async function iterateA (obj, fn, { col, type, iter, iterA }) {
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
function iterate (obj, fn, { col, type, iter }) {
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

// Apply the return filter and return fn to an iteration result
// Note: Shared by sync and async filtered iteration
function applyRet (res, ret, val, key, retFn, retFltr, accFn) {
    if (ret === BREAK) {
        return ret;
    }
    if (retFltr && !retFltr(ret)) {
        return;
    }
    return retFn ? retFn(res, ret, val, key, accFn) : ret;
}

// Async alias
async function iterateFA (obj, fn, { col, type, iter, iterA, retFn, res, valFltr, retFltr, accFn }) {
    await iterateA(obj, async (val, key, obj) => {
        if (valFltr && !valFltr(val)) {
            return;
        }
        let ret = accFn ? await fn(accFn(val), val, key, obj) : await fn(val, key, obj);
        return applyRet(res, ret, val, key, retFn, retFltr, accFn);
    }, { col, type, iter, iterA });
    return isFunction(res) ? res() : res;
}

// Run an iterator fn for each item in obj with filters
// Accepts optional return function, return value, value filter, and return value filter
// Note: Useful for composing other types of iteration methods
// Note: Return function, value filter, return filter, and accumulator function are not validated
// Note: Can break iteration early by returning BREAK symbol
function iterateF (obj, fn, { col, type, iter, retFn, res, valFltr, retFltr, accFn }) {
    iterate(obj, (val, key, obj) => {
        if (valFltr && !valFltr(val)) {
            return;
        }
        let ret = accFn ? fn(accFn(val), val, key, obj) : fn(val, key, obj);
        return applyRet(res, ret, val, key, retFn, retFltr, accFn);
    }, { col, type, iter });
    return isFunction(res) ? res() : res;
}

// Determine whether to iterate sync or async
// Async when the fn is async, or the source is async-only (not also sync iterable)
function isAsync (iter, iterA, fnA) {
    return fnA || (iterA && !iter);
}

// Compose iteration method
// Note: Checks type info
// Returns sync or async based on obj and fn type signatures
function compose (obj, fn, col=1) {
    let type = getType(obj);
    let iter = isIterable(obj);
    let iterA = isAsyncIterable(obj);
    let fnA = isAsyncFunction(fn);
    let async = isAsync(iter, iterA, fnA);
    fn = toFn(fn, id);
    if (async) {
        return iterateA(obj, fn, { col, type, iter, iterA });
    }
    return iterate(obj, fn, { col, type, iter });
}

// Compose iteration method with filters
// Note: Checks type info
// Returns sync or async based on obj and fn type signatures
function composeF (obj, fn, col=1, { retFn, res, valFltr, retFltr, accFn } = {}) {
    let type = getType(obj);
    let iter = isIterable(obj);
    let iterA = isAsyncIterable(obj);
    let fnA = isAsyncFunction(fn);
    let async = isAsync(iter, iterA, fnA);
    fn = toFn(fn, id);
    if (async) {
        return iterateFA(obj, fn, { col, type, iter, iterA, retFn, res, valFltr, retFltr, accFn });
    }
    return iterateF(obj, fn, { col, type, iter, retFn, res, valFltr, retFltr, accFn });
}

// Return the notNil predicate as a filter when enabled, else undefined
function nilFltr (on) {
    return on ? notNil : undefined;
}

// Run an iterator fn for each item in obj
// Opts: { entries, notNil }
export function each (obj, fn, { entries, notNil } = {}) {
    if (notNil) {
        return composeF(obj, fn, !entries, { res: obj, valFltr: nilFltr(notNil) });
    }
    return compose(obj, fn, !entries);
}

function mapFn (res, ret) {
    res.push(ret);
}

// Return a new array of return values from iterator fn
export function map (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: mapFn, res: [], valFltr: f, retFltr: f });
}

function tapFn (res, ret, val) {
    res.push(val);
}

// Run an iterator fn for each item in obj, return new array with original values
export function tap (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: tapFn, res: [], valFltr: f });
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
export function some (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: someFn, res: resFn(false), valFltr: f, retFltr: f });
}

function everyFn (res, ret) {
    if (!ret) {
        res(false);
        return BREAK;
    }
}

// Return true if iterator fn returns truthy for all items in obj
export function every (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: everyFn, res: resFn(true), valFltr: f, retFltr: f });
}

function filterFn (res, ret, val) {
    if (ret) {
        res.push(val);
    }
}

// Return new array with items that iterator fn returns truthy for
export function filter (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: filterFn, res: [], valFltr: f, retFltr: f });
}

function removeFn (res, ret, val) {
    if (!ret) {
        res.push(val);
    }
}

// Return new array with items that iterator fn returns falsy for
export function remove (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: removeFn, res: [], valFltr: f, retFltr: f });
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
export function drop (obj, num, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, undefined, !entries, { retFn: dropFn(num), res: [], valFltr: f, retFltr: f });
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
export function take (obj, num, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, undefined, !entries, { retFn: takeFn(num), res: [], valFltr: f, retFltr: f });
}

function findFn (res, ret, val) {
    if (ret) {
        res(val);
        return BREAK;
    }
}

// Return first item that iterator fn returns truthy for
export function find (obj, fn, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: findFn, res: resFn(), valFltr: f, retFltr: f });
}

const GET = Symbol();
const SET = Symbol();

function reduceFn (res, ret, val, key, accFn) {
    return res(accFn(ret, SET));
}

// Getter/Setter
// Each iteration receives acc as the return value from the previous call
function reduceAcc (acc) {
    let init = isNil(acc);
    return (val, action=GET) => {
        if (init) {
            acc = of(val);
            init = 0;
        }
        if (action === SET) {
            return acc = val;
        }
        return acc;
    }
}

// Reduce obj to accumulated result from running each item through iterator fn
export function reduce (obj, fn, acc, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: reduceFn, res: resFn(), valFltr: f, retFltr: f, accFn: reduceAcc(acc) });
}

function transformFn (res, ret, val, key, accFn) {
    return res(accFn());
}

// Getter/Setter
// Each iteration receives acc as the same initial value
function transformAcc (acc, obj) {
    if (isNil(acc)) {
        acc = of(obj);
    }
    return (val, action=GET) => {
        return acc;
    }
}

// Transform obj to new accumulated result from running each item through iterator fn
export function transform (obj, fn, acc, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return composeF(obj, fn, !entries, { retFn: transformFn, res: resFn(), valFltr: f, retFltr: f, accFn: transformAcc(acc, obj) });
}

// -1 or Infinity to recurse all depths (susceptible to call stack limit)
function flatMapFn (obj, fn, recurse=1, col, res=[], valFltr, retFltr) {
    return composeF(obj, fn, col, {
        retFn: (res, ret) => {
            let type = getType(ret);
            if (type.collection && recurse) {
                return flatMapFn(ret, fn, recurse-1, col, res, valFltr, retFltr);
            } else {
                res.push(ret);
            }
        },
        res,
        valFltr,
        retFltr
    });
}

// Recursively iterate values returned from iterator fn into flattened result
export function flatMap (obj, fn, recurse, { entries, notNil } = {}) {
    let f = nilFltr(notNil);
    return flatMapFn(obj, fn, recurse, !entries, undefined, f, f);
}

export {
    each as forEach,
    compose as iterate,
    composeF as iterateF
};
