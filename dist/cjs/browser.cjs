var constants = require('./lib/constants.cjs');
var types = require('./lib/types.cjs');
var iterate = require('./lib/iterate.cjs');
var util = require('./lib/util.cjs');
var browser$2 = require('./types/browser.cjs');
var browser$1 = require('./lib/browser.cjs');

constants.addTypes(browser$2.default);

var browser = {
    BREAK: constants.BREAK,
    noop: constants.noop,
    ...types,
    ...iterate,
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
exports.isArrayBuffer = types.isArrayBuffer;
exports.isAsyncFunction = types.isAsyncFunction;
exports.isAsyncIterable = types.isAsyncIterable;
exports.isBoolean = types.isBoolean;
exports.isCollection = types.isCollection;
exports.isCtor = types.isCtor;
exports.isError = types.isError;
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
exports.isRegExp = types.isRegExp;
exports.isString = types.isString;
exports.isTypedArray = types.isTypedArray;
exports.isUndefined = types.isUndefined;
exports.notNil = types.notNil;
exports.toArray = types.toArray;
exports.toFn = types.toFn;
exports.toNativeType = types.toNativeType;
exports.toObject = types.toObject;
exports.toPath = types.toPath;
exports.toString = types.toString;
exports.toType = types.toType;
exports.each = iterate.each;
exports.eachNotNil = iterate.eachNotNil;
exports.every = iterate.every;
exports.everyNotNil = iterate.everyNotNil;
exports.filter = iterate.filter;
exports.filterNotNil = iterate.filterNotNil;
exports.forEach = iterate.forEach;
exports.forIn = iterate.forIn;
exports.forOwn = iterate.forOwn;
exports.iterate = iterate.iterate;
exports.iterateF = iterate.iterateF;
exports.map = iterate.map;
exports.mapNotNil = iterate.mapNotNil;
exports.remove = iterate.remove;
exports.removeNotNil = iterate.removeNotNil;
exports.some = iterate.some;
exports.someNotNil = iterate.someNotNil;
exports.tap = iterate.tap;
exports.tapNotNil = iterate.tapNotNil;
exports.assign = util.assign;
exports.capitalize = util.capitalize;
exports.compact = util.compact;
exports.concat = util.concat;
exports.defaults = util.defaults;
exports.flat = util.flat;
exports.flatCompact = util.flatCompact;
exports.freeze = util.freeze;
exports.fromPairs = util.fromPairs;
exports.get = util.get;
exports.getOwn = util.getOwn;
exports.has = util.has;
exports.join = util.join;
exports.keys = util.keys;
exports.merge = util.merge;
exports.set = util.set;
exports.setOwn = util.setOwn;
exports.split = util.split;
exports.toCamel = util.toCamel;
exports.toKebab = util.toKebab;
exports.toLower = util.toLower;
exports.toPairs = util.toPairs;
exports.toPascal = util.toPascal;
exports.toSnake = util.toSnake;
exports.toUpper = util.toUpper;
exports.isElement = browser$1.isElement;
exports.isNodeList = browser$1.isNodeList;
exports.default = browser;
