var constants = require('./constants.cjs');
var types = require('./types.cjs');

// Async alias
async function forInA (obj, fn=constants.identity) {
    for (const key in obj) {
        if (await fn(obj[key], key, obj) === constants.BREAK) {
            break;
        }    }
    return obj;
}

// Run an iterator fn for each own and inherited enumerable property in obj
// Note: Can break iteration early by returning BREAK symbol
function forIn (obj, fn=constants.identity) {
    if (types.isAsyncFunction(fn)) {
        return forInA(obj, fn);
    }
    fn = types.toFn(fn);
    for (const key in obj) {
        if (fn(obj[key], key, obj) === constants.BREAK) {
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
function forEach (obj, fn=constants.identity) {
    fn = types.toFn(fn);
    if (types.hasForEach(obj)) {
        try {
            obj.forEach((val, idx, obj) => {
                if (fn(val, idx, obj) === constants.BREAK) {
                    throw constants.BREAK;
                }
            });
        } catch (err) {
            if (err !== constants.BREAK) {
                throw err;
            }
        }
    } else {
        fn(obj, 0, obj);
    }
}

// Async alias
async function iterateA (obj, fn=constants.identity, col=1, type, iter, iterA, fnA) {
    if (types.notNil(obj)) {
        if (col && !type.collection && !type.object) {
            await fn(obj, 0, obj);
        } else {
            if (iterA) {
                let index = 0;
                for await (const val of obj) {
                    if (await fn(val, index++, obj) === constants.BREAK) {
                        break;
                    }
                }
            } else if (type.entries) {
                for (const [key, val] of obj.entries()) {
                    if (await fn(val, key, obj) === constants.BREAK) {
                        break;
                    }
                }
            } else if (iter) {
                let index = 0;
                for (const val of obj) {
                    if (await fn(val, index++, obj) === constants.BREAK) {
                        break;
                    }
                }
            } else if (!col && type.object) {
                for (const [key, val] of Object.entries(obj)) {
                    if (await fn(val, key, obj) === constants.BREAK) {
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
function iterate (obj, fn=constants.identity, col=1, type, iter) {
    if (types.notNil(obj)) {
        if (col && !type.collection && !type.object) {
            fn(obj, 0, obj);
        } else {
            if (type.entries) {
                for (const [key, val] of obj.entries()) {
                    if (fn(val, key, obj) === constants.BREAK) {
                        break;
                    }
                }
            } else if (iter) {
                let index = 0;
                for (const val of obj) {
                    if (fn(val, index++, obj) === constants.BREAK) {
                        break;
                    }
                }
            } else if (!col && type.object) {
                for (const [key, val] of Object.entries(obj)) {
                    if (fn(val, key, obj) === constants.BREAK) {
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
async function iterateFA (obj, fn=constants.identity, col, retFn, res, valFltr, retFltr, accFn, type, iter, iterA, fnA) {
    await iterateA(obj, async (val, key, obj) => {
        let ret;
        if (valFltr) {
            if (valFltr(val)) {
                ret = accFn ? await fn(accFn(val), val, key, obj) : await fn(val, key, obj);
            } else {
                return;
            }
        } else {
            ret = accFn ? await fn(accFn(val), val, key, obj) : await fn(val, key, obj);
        }
        if (ret === constants.BREAK) {
            return ret;
        }
        if (retFltr) {
            if (retFltr(ret)) {
                return retFn ? retFn(res, ret, val, key, accFn) : ret;
            } else {
                return;
            }
        } else {
            return retFn ? retFn(res, ret, val, key, accFn) : ret;
        }
    }, col, type, iter, iterA);
    return types.isFunction(res) ? res() : res;
}

// Run an iterator fn for each item in obj with filters
// Accepts optional return function, return value, value filter, and return value filter
// Note: Useful for composing other types of iteration methods
// Note: Return function, value filter, return filter, and accumulator function are not validated
// Note: Can break iteration early by returning BREAK symbol
function iterateF (obj, fn=constants.identity, col, retFn, res, valFltr, retFltr, accFn, type, iter) {
    iterate(obj, (val, key, obj) => {
        let ret;
        if (valFltr) {
            if (valFltr(val)) {
                ret = accFn ? fn(accFn(val), val, key, obj) : fn(val, key, obj);
            } else {
                return;
            }
        } else {
            ret = accFn ? fn(accFn(val), val, key, obj) : fn(val, key, obj);
        }
        if (ret === constants.BREAK) {
            return ret;
        }
        if (retFltr) {
            if (retFltr(ret)) {
                return retFn ? retFn(res, ret, val, key, accFn) : ret;
            } else {
                return;
            }
        } else {
            return retFn ? retFn(res, ret, val, key, accFn) : ret;
        }
    }, col, type, iter);
    return types.isFunction(res) ? res() : res;
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
// Returns sync or async based on obj and fn type signatures
function compose (obj, fn, col=1) {
    let type = types.getType(obj);
    let iter = types.isIterable(obj);
    let iterA = types.isAsyncIterable(obj);
    let fnA = types.isAsyncFunction(fn);
    let async = isAsync(iter, iterA, fnA);
    fn = types.toFn(fn, constants.identity);
    if (async) {
        return iterateA(obj, fn, col, type, iter, iterA);
    }
    return iterate(obj, fn, col, type, iter);
}

// Compose iteration method with filters
// Note: Checks type info
// Returns sync or async based on obj and fn type signatures
function composeF (obj, fn, col=1, retFn, res, valFltr, retFltr, accFn) {
    let type = types.getType(obj);
    let iter = types.isIterable(obj);
    let iterA = types.isAsyncIterable(obj);
    let fnA = types.isAsyncFunction(fn);
    let async = isAsync(iter, iterA, fnA);
    fn = types.toFn(fn, constants.identity);
    if (async) {
        return iterateFA(obj, fn, col, retFn, res, valFltr, retFltr, accFn, type, iter, iterA);
    }
    return iterateF(obj, fn, col, retFn, res, valFltr, retFltr, accFn, type, iter);
}

// Run an iterator fn for each item in obj
function each (obj, fn, col) {
    return compose(obj, fn, col);
}

// Alias for each (ignores null and undefined)
function eachNotNil (obj, fn, col) {
    return composeF(obj, fn, col, undefined, obj, types.notNil);
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
    return composeF(obj, fn, col, mapFn, [], types.notNil, types.notNil);
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
    return composeF(obj, fn, col, tapFn, [], types.notNil);
}

// Getter/Setter for response values that can't be passed by reference
function resFn (res) {
    return val => {
        if (types.notNil(val)) {
            res = val;
        } else {
            return res;
        }
    }
}

function someFn (res, ret) {
    if (ret) {
        res(true);
        return constants.BREAK;
    }
}

// Return true if iterator fn returns truthy for any item in obj
function some (obj, fn, col) {
    return composeF(obj, fn, col, someFn, resFn(false));
}

// Alias for some (ignores null and undefined)
function someNotNil (obj, fn, col) {
    return composeF(obj, fn, col, someFn, resFn(false), types.notNil, types.notNil);
}

function everyFn (res, ret) {
    if (!ret) {
        res(false);
        return constants.BREAK;
    }
}

// Return true if iterator fn returns truthy for all items in obj
function every (obj, fn, col) {
    return composeF(obj, fn, col, everyFn, resFn(true));
}

// Alias for every (ignores null and undefined)
function everyNotNil (obj, fn, col) {
    return composeF(obj, fn, col, everyFn, resFn(true), types.notNil, types.notNil);
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
    return composeF(obj, fn, col, filterFn, [], types.notNil, types.notNil);
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
    return composeF(obj, fn, col, removeFn, [], types.notNil, types.notNil);
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
    return composeF(obj, undefined, col, dropFn(num), [], types.notNil, types.notNil);
}

// -1 or Infinity to take all
function takeFn (num=-1) {
    return function (res, ret, val) {
        if (num) {
            res.push(val);
            num--;
        } else {
            return constants.BREAK;
        }
    }
}

// Return new array with n number of items from head
function take (obj, num, col) {
    return composeF(obj, undefined, col, takeFn(num), []);
}

// Alias for take (ignores null and undefined)
function takeNotNil (obj, num, col) {
    return composeF(obj, undefined, col, takeFn(num), [], types.notNil, types.notNil);
}

function findFn (res, ret, val) {
    if (ret) {
        res(val);
        return constants.BREAK;
    }
}

// Return first item that iterator fn returns truthy for
function find (obj, fn, col) {
    return composeF(obj, fn, col, findFn, resFn());
}

// Alias for find (ignores null and undefined)
function findNotNil (obj, fn, col) {
    return composeF(obj, fn, col, findFn, resFn(), types.notNil, types.notNil);
}

const GET = Symbol();
const SET = Symbol();

function reduceFn (res, ret, val, key, accFn) {
    return res(accFn(ret, SET));
}

// Getter/Setter
// Each iteration receives acc as the return value from the previous call
function reduceAcc (acc) {
    let init = types.isNil(acc);
    return (val, action=GET) => {
        if (init) {
            acc = types.of(val);
            init = 0;
        }
        if (action === SET) {
            return acc = val;
        }
        return acc;
    }
}

// Reduce obj to accumulated result from running each item through iterator fn
function reduce (obj, fn, acc, col) {
    return composeF(obj, fn, col, reduceFn, resFn(), undefined, undefined, reduceAcc(acc));
}

// Alias for reduce (ignores null and undefined)
function reduceNotNil (obj, fn, acc, col) {
    return composeF(obj, fn, col, reduceFn, resFn(), types.notNil, types.notNil, reduceAcc(acc));
}

function transformFn (res, ret, val, key, accFn) {
    return res(accFn());
}

// Getter/Setter
// Each iteration receives acc as the same initial value
function transformAcc (acc, obj) {
    if (types.isNil(acc)) {
        acc = types.of(obj);
    }
    return (val, action=GET) => {
        return acc;
    }
}

// Transform obj to new accumulated result from running each item through iterator fn
function transform (obj, fn, acc, col) {
    return composeF(obj, fn, col, transformFn, resFn(), undefined, undefined, transformAcc(acc, obj));
}

// Alias for transform (ignores null and undefined)
function transformNotNil (obj, fn, acc, col) {
    return composeF(obj, fn, col, transformFn, resFn(), types.notNil, types.notNil, transformAcc(acc, obj));
}

// -1 or Infinity to recurse all depths (susceptible to call stack limit)
function flatMapFn (obj, fn, recurse=1, col, res=[], ...args) {
    return composeF(obj, fn, col, (res, ret) => {
        let type = types.getType(ret);
        if (type.collection && recurse) {
            flatMapFn(ret, fn, recurse-1, col, res, ...args);
        } else {
            res.push(ret);
        }
    }, res, ...args);
}

// Recursively iterate values returned from iterator fn into flattened result
function flatMap (obj, fn, recurse, col) {
    return flatMapFn(obj, fn, recurse, col);
}

// Alias for flatMap (ignores null and undefined)
function flatMapNotNil (obj, fn, recurse, col) {
    return flatMapFn(obj, fn, recurse, col, undefined, types.notNil, types.notNil);
}

exports.drop = drop;
exports.dropNotNil = dropNotNil;
exports.each = each;
exports.eachNotNil = eachNotNil;
exports.every = every;
exports.everyNotNil = everyNotNil;
exports.filter = filter;
exports.filterNotNil = filterNotNil;
exports.find = find;
exports.findNotNil = findNotNil;
exports.flatMap = flatMap;
exports.flatMapNotNil = flatMapNotNil;
exports.forEach = forEach;
exports.forIn = forIn;
exports.forOwn = forOwn;
exports.iterate = compose;
exports.iterateF = composeF;
exports.map = map;
exports.mapNotNil = mapNotNil;
exports.reduce = reduce;
exports.reduceNotNil = reduceNotNil;
exports.remove = remove;
exports.removeNotNil = removeNotNil;
exports.some = some;
exports.someNotNil = someNotNil;
exports.take = take;
exports.takeNotNil = takeNotNil;
exports.tap = tap;
exports.tapNotNil = tapNotNil;
exports.transform = transform;
exports.transformNotNil = transformNotNil;
