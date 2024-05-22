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
function forEach (iter, fn) {
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

exports.each = each;
exports.eachNotNil = eachNotNil;
exports.every = every;
exports.everyNotNil = everyNotNil;
exports.filter = filter;
exports.filterNotNil = filterNotNil;
exports.forEach = forEach;
exports.forIn = forIn;
exports.forOwn = forOwn;
exports.iterate = iterate;
exports.iterateF = iterateF;
exports.map = map;
exports.mapNotNil = mapNotNil;
exports.remove = remove;
exports.removeNotNil = removeNotNil;
exports.some = some;
exports.someNotNil = someNotNil;
exports.tap = tap;
exports.tapNotNil = tapNotNil;
