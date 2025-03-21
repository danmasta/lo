var argv = require('./lib/argv.cjs');
var constants = require('./lib/constants.cjs');
var env = require('./lib/env.cjs');
var ip = require('./lib/ip.cjs');
var iterate = require('./lib/iterate.cjs');
var node = require('./lib/node.cjs');
var types = require('./lib/types.cjs');
var util = require('./lib/util.cjs');
var node$1 = require('./types/node.cjs');
var node_process = require('node:process');
var base = require('./types/base.cjs');

constants.addTypes(node$1.default);

var index = {
    BREAK: constants.BREAK,
    noop: constants.noop,
    TYPES: constants.TYPES,
    ...argv,
    ...env,
    ...ip,
    ...iterate,
    ...node,
    ...types,
    ...util
};

exports.argv = argv.parseArgv;
exports.optsFromArgv = argv.optsFromArgv;
exports.parseArgv = argv.parseArgv;
exports.BREAK = constants.BREAK;
exports.TYPES = constants.TYPES;
exports.noop = constants.noop;
exports.env = env.env;
exports.isNilEnv = env.isNilEnv;
exports.fromIp = ip.fromIp;
exports.fromIp4 = ip.fromIp4;
exports.fromIp6 = ip.fromIp6;
exports.fromIp6Parts = ip.fromIp6Parts;
exports.toIp = ip.toIp;
exports.toIp4 = ip.toIp4;
exports.toIp6 = ip.toIp6;
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
exports.importOrRequire = node.importOrRequire;
exports.importOrRequireFiles = node.importOrRequireFiles;
exports.importRequireOrRead = node.importRequireOrRead;
exports.importRequireOrReadFiles = node.importRequireOrReadFiles;
exports.isBuffer = node.isBuffer;
exports.isDuplex = node.isDuplex;
exports.isPassThrough = node.isPassThrough;
exports.isReadable = node.isReadable;
exports.isStream = node.isStream;
exports.isTransform = node.isTransform;
exports.isWritable = node.isWritable;
exports.mkdirp = node.mkdirp;
exports.mkdirpSync = node.mkdirpSync;
exports.readFiles = node.readFiles;
exports.readFilesSync = node.readFilesSync;
exports.require = node.require;
exports.requireFiles = node.requireFiles;
exports.requireOrReadFilesSync = node.requireOrReadFilesSync;
exports.requireOrReadSync = node.requireOrReadSync;
exports.resolve = node.resolve;
exports.resolveIfExists = node.resolveIfExists;
exports.resolveIfExistsSync = node.resolveIfExistsSync;
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
exports.assign = util.assign;
exports.assignDefaults = util.assignDefaults;
exports.assignIn = util.assignIn;
exports.assignWithOpts = util.assignWithOpts;
exports.capitalize = util.capitalize;
exports.compact = util.compact;
exports.concat = util.concat;
exports.deburr = util.deburr;
exports.defaults = util.defaults;
exports.eachLine = util.eachLine;
exports.escapeHTML = util.escapeHTML;
exports.flat = util.flat;
exports.flatCompact = util.flatCompact;
exports.fmt = util.format;
exports.format = util.format;
exports.freeze = util.freeze;
exports.fromPairs = util.fromPairs;
exports.get = util.get;
exports.getOwn = util.getOwn;
exports.has = util.has;
exports.join = util.join;
exports.keys = util.keys;
exports.mapLine = util.mapLine;
exports.merge = util.merge;
exports.mergeDefaults = util.mergeDefaults;
exports.mergeIn = util.mergeIn;
exports.pad = util.pad;
exports.padLeft = util.padLeft;
exports.padLine = util.padLine;
exports.padLineLeft = util.padLineLeft;
exports.padLineRight = util.padLineRight;
exports.padRight = util.padRight;
exports.set = util.set;
exports.setOwn = util.setOwn;
exports.split = util.split;
exports.toCamelCase = util.toCamelCase;
exports.toKebabCase = util.toKebabCase;
exports.toLower = util.toLower;
exports.toLowerCase = util.toLowerCase;
exports.toLowerFirst = util.toLowerFirst;
exports.toPairs = util.toPairs;
exports.toPascalCase = util.toPascalCase;
exports.toSnakeCase = util.toSnakeCase;
exports.toStartCase = util.toStartCase;
exports.toUpper = util.toUpper;
exports.toUpperCase = util.toUpperCase;
exports.toUpperFirst = util.toUpperFirst;
exports.trim = util.trim;
exports.trimLeft = util.trimLeft;
exports.trimRight = util.trimRight;
exports.unescapeHTML = util.unescapeHTML;
exports.words = util.words;
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
exports.hasOwn = base.hasOwn;
exports.default = index;
