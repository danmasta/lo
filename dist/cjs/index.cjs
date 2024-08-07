var constants = require('./lib/constants.cjs');
var types = require('./lib/types.cjs');
var iterate = require('./lib/iterate.cjs');
var util = require('./lib/util.cjs');
var node$1 = require('./types/node.cjs');
var node = require('./lib/node.cjs');
var node_process = require('node:process');

constants.addTypes(node$1.default);

var index = {
    BREAK: constants.BREAK,
    noop: constants.noop,
    ...types,
    ...iterate,
    ...util,
    ...node
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
exports.isAsyncIterable = types.isAsyncIterable;
exports.isBoolean = types.isBoolean;
exports.isBuffer = types.isBuffer;
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
exports.argv = node.argv;
exports.env = node.env;
exports.importOrRequire = node.importOrRequire;
exports.importOrRequireFiles = node.importOrRequireFiles;
exports.importRequireOrRead = node.importRequireOrRead;
exports.importRequireOrReadFiles = node.importRequireOrReadFiles;
exports.isDuplex = node.isDuplex;
exports.isNilEnv = node.isNilEnv;
exports.isPassThrough = node.isPassThrough;
exports.isReadable = node.isReadable;
exports.isStream = node.isStream;
exports.isTransform = node.isTransform;
exports.isWritable = node.isWritable;
exports.optsFromArgv = node.optsFromArgv;
exports.parseArgv = node.argv;
exports.readFiles = node.readFiles;
exports.readFilesSync = node.readFilesSync;
exports.require = node.require;
exports.requireFiles = node.requireFiles;
exports.requireOrReadFilesSync = node.requireOrReadFilesSync;
exports.requireOrReadSync = node.requireOrReadSync;
exports.resolve = node.resolve;
exports.resolveIfExists = node.resolveIfExists;
exports.resolveIfExistsSync = node.resolveIfExistsSync;
Object.defineProperty(exports, "ARGV", {
    enumerable: true,
    get: function () { return node_process.argv; }
});
Object.defineProperty(exports, "CWD", {
    enumerable: true,
    get: function () { return node_process.cwd; }
});
Object.defineProperty(exports, "ENV", {
    enumerable: true,
    get: function () { return node_process.env; }
});
exports.default = index;
