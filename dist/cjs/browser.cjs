var constants = require('./lib/constants.cjs');
var types = require('./lib/types.cjs');
var util = require('./lib/util.cjs');
var browser$2 = require('./types/browser.cjs');
var browser$1 = require('./lib/browser.cjs');

constants.addTypes(browser$2.default);

var browser = {
    BREAK: constants.BREAK,
    noop: constants.noop,
    ...types,
    ...util,
    ...browser$1
};

exports.BREAK = constants.BREAK;
exports.hasOwn = constants.hasOwn;
exports.noop = constants.noop;
exports.getCtorType = types.getCtorType;
exports.getCtorTypeStr = types.getCtorTypeStr;
exports.getType = types.getType;
exports.getTypeFromCtor = types.getTypeFromCtor;
exports.getTypeFromProto = types.getTypeFromProto;
exports.getTypeStr = types.getTypeStr;
exports.hasEntries = types.hasEntries;
exports.hasForEach = types.hasForEach;
exports.isArray = types.isArray;
exports.isAsyncFunction = types.isAsyncFunction;
exports.isBoolean = types.isBoolean;
exports.isBuffer = types.isBuffer;
exports.isCollection = types.isCollection;
exports.isCtor = types.isCtor;
exports.isEsmMode = types.isEsmMode;
exports.isFunction = types.isFunction;
exports.isGeneratorFunction = types.isGeneratorFunction;
exports.isIterable = types.isIterable;
exports.isIterator = types.isIterator;
exports.isModule = types.isModule;
exports.isNil = types.isNil;
exports.isNull = types.isNull;
exports.isNumber = types.isNumber;
exports.isNumeric = types.isNumeric;
exports.isObject = types.isObject;
exports.isPromise = types.isPromise;
exports.isString = types.isString;
exports.isTypedArray = types.isTypedArray;
exports.isUndefined = types.isUndefined;
exports.notNil = types.notNil;
exports.toArray = types.toArray;
exports.toFn = types.toFn;
exports.toObject = types.toObject;
exports.toPath = types.toPath;
exports.toString = types.toString;
exports.toType = types.toType;
exports.assign = util.assign;
exports.compact = util.compact;
exports.concat = util.concat;
exports.defaults = util.defaults;
exports.each = util.each;
exports.eachNotNil = util.eachNotNil;
exports.every = util.every;
exports.everyNotNil = util.everyNotNil;
exports.filter = util.filter;
exports.filterNotNil = util.filterNotNil;
exports.flat = util.flat;
exports.flatCompact = util.flatCompact;
exports.forEach = util.forEach;
exports.forIn = util.forIn;
exports.forOwn = util.forOwn;
exports.freeze = util.freeze;
exports.get = util.get;
exports.getOwn = util.getOwn;
exports.has = util.has;
exports.iterate = util.iterate;
exports.iterateF = util.iterateF;
exports.join = util.join;
exports.keys = util.keys;
exports.map = util.map;
exports.mapNotNil = util.mapNotNil;
exports.merge = util.merge;
exports.remove = util.remove;
exports.removeNotNil = util.removeNotNil;
exports.set = util.set;
exports.setOwn = util.setOwn;
exports.some = util.some;
exports.someNotNil = util.someNotNil;
exports.tap = util.tap;
exports.tapNotNil = util.tapNotNil;
exports.isElement = browser$1.isElement;
exports.isNodeList = browser$1.isNodeList;
exports.default = browser;
