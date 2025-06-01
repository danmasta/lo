import * as argv from './lib/argv.js';
export { parseArgv as argv, getArgv, isQJS, optsFromArgv, parseArgv } from './lib/argv.js';
import { addTypes, addType, BREAK, noop, TYPES } from './lib/constants.js';
export { hasOwn } from './lib/constants.js';
import * as env from './lib/env.js';
export { env, isNilEnv } from './lib/env.js';
import * as ip from './lib/ip.js';
export { fromIp, fromIp4, fromIp6, fromIp6Parts, toIp, toIp4, toIp6 } from './lib/ip.js';
import * as iterate from './lib/iterate.js';
export { each, eachNotNil, every, everyNotNil, filter, filterNotNil, forEach, forIn, forOwn, iterate, iterateF, map, mapNotNil, remove, removeNotNil, some, someNotNil, tap, tapNotNil } from './lib/iterate.js';
import * as node from './lib/node.js';
export { importOrRequire, importOrRequireFiles, importRequireOrRead, importRequireOrReadFiles, isBuffer, isDuplex, isPassThrough, isReadable, isStream, isTransform, isWritable, mkdirp, mkdirpSync, readFiles, readFilesSync, readJson, readJsonSync, require, requireFiles, requireOrReadFilesSync, requireOrReadSync, resolve, resolveIfExists, resolveIfExistsSync } from './lib/node.js';
import * as types from './lib/types.js';
export { getCtorType, getCtorTypeStr, getType, getTypeFromCtor, getTypeFromProto, getTypeStr, hasEntries, hasForEach, isArray, isArrayBuffer, isAsyncFunction, isAsyncIterable, isBoolean, isClass, isCollection, isCtor, isError, isEsm, isFunction, isGeneratorFunction, isIterable, isIterator, isModule, isNil, isNull, isNumber, isNumeric, isObject, isPromise, isRegExp, isString, isTypedArray, isUndefined, notNil, toArray, toFn, toNativeType, toObject, toPath, toString, toType } from './lib/types.js';
import * as util from './lib/util.js';
export { assign, assignDefaults, assignDefaultsClone, assignIn, assignInClone, assignWithOpts, capitalize, compact, concat, deburr, defaults, eachLine, escapeHTML, flat, flatCompact, format as fmt, format, formatWithOpts, formatter, freeze, fromPairs, get, getOwn, has, join, keys, mapLine, merge, mergeDefaults, mergeDefaultsClone, mergeIn, mergeInClone, pad, padLeft, padLine, padLineLeft, padLineRight, padRight, replace, set, setOwn, split, toCamelCase, toKebabCase, toLower, toLowerCase, toLowerFirst, toPairs, toPascalCase, toSnakeCase, toStartCase, toUpper, toUpperCase, toUpperFirst, trim, trimLeft, trimRight, unescapeHTML, words } from './lib/util.js';
import supplemental from './types/node.js';
export { argv as ARGV, cwd as CWD, env as ENV } from './polyfill/qjs/process.js';

addTypes(supplemental);

var qjs = {
    addType,
    addTypes,
    BREAK,
    noop,
    TYPES,
    ...argv,
    ...env,
    ...ip,
    ...iterate,
    ...node,
    ...types,
    ...util
};

export { BREAK, TYPES, addType, addTypes, qjs as default, noop };
