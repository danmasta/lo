var constants = require('./constants.cjs');

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
function toStringTag (obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

// Get the type definition from an object's prototype
// Will recurse 1 level to check parent proto if recurse not explicitly false
// Will recurse the whole prototype chain if recurse is true
function getTypeFromProto (obj, recurse) {
    let type = constants.typesByProto.get(constants.getPrototypeOf(obj));
    if (type) {
        return type;
    }
    if (recurse !== false) {
        // Check the parent prototype
        return getTypeFromProto(obj.constructor.prototype, recurse === true);
    }
    if (constants.isPrototypeOf.call(Error.prototype, obj)) {
        return constants.TYPES.Error;
    }
    if (constants.TYPES[type = toStringTag(obj)]) {
        return constants.TYPES[type];
    }
    // What to return if not found? Undefined, TYPES.Undefined, or StringTag?
    // Need to test for not found states
    return type;
}

// Get the type definition from constructor function
function getTypeFromCtor (obj, recurse) {
    let type = constants.typesByCtor.get(obj);
    if (type) {
        return type;
    }
    if (recurse !== false) {
        // If subclass the constructor prototype will be the parent class
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
        return getTypeFromCtor(constants.getPrototypeOf(obj), false);
    }
    if (constants.isPrototypeOf.call(Error.prototype, obj.prototype)) {
        return constants.TYPES.Error;
    }
    // Not sure which is more accurate yet
    // Regular classes will have a constructor of Function
    // return getTypeFromCtor(obj.constructor);
    if (constants.TYPES[type = toStringTag(obj)]) {
        return constants.TYPES[type];
    }
    return type;
}

// Get the object type definition
// Uses typeof if possible otherwise checks it's prototype
function getType (obj) {
    let type = constants.typesByType.get(typeof obj);
    switch (type) {
        case constants.TYPES.Function:
            if (obj.constructor !== constants.TYPES.Function.ctor) {
                return getTypeFromProto(obj);
            }
            return type;
        case constants.TYPES.Number:
            if (Number.isNaN(obj)) {
                return constants.TYPES.NaN;
            }
            if (obj === Infinity || obj === -Infinity) {
                return constants.TYPES.Infinity;
            }
            return type;
        case constants.TYPES.Object:
            if (obj === null) {
                return constants.TYPES.Null;
            }
            if (Array.isArray(obj)) {
                return constants.TYPES.Array;
            }
            // TypedArrays
            // Module
            if (obj[Symbol.toStringTag] && constants.TYPES[type = obj[Symbol.toStringTag]]) {
                return constants.TYPES[type];
            }
            return getTypeFromProto(obj);
        default:
            return type;
    }
}

function getTypeStr (obj) {
    return (obj = getType(obj))?.name ? obj.name : toStringTag(obj);
}

function getCtorType (obj) {
    return getTypeFromCtor(obj);
}

function getCtorTypeStr (obj) {
    return (obj = getCtorType(obj))?.name ? obj.name : toStringTag(obj);
}

// Convert object to a specific type via a constructor or factory function
// Note: Does not validate arguments
function toType (Type, obj, ...args) {
    let type = getType(obj);
    let ctor = getTypeFromCtor(Type);
    if (type === ctor) {
        return obj;
    }
    switch (ctor?.create) {
        case 1:
            return Type.call(undefined, obj, ...args);
        case 2:
            return new Type(obj, ...args);
        default:
            throw new TypeError('Type cannot be called or constructed');
    }
}

// Reflect.construct throws TypeError if target is not a constructor
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct
function isCtor (Fn) {
    try {
        Reflect.construct(Fn, []);
        return true;
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('constructor')) {
            return false;
        }
        return true;
    }
}

function isNil (obj) {
    return obj == null;
}

function notNil (obj) {
    return obj != null;
}

function isNull (obj) {
    return obj === null;
}

function isUndefined (obj) {
    return obj === undefined;
}

// Test if running in esm or commonjs mode
function isEsmMode () {
    return typeof module === 'undefined';
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object
function isModule (obj) {
    return getType(obj) === constants.TYPES.Module;
}

function isObject (obj) {
    return getType(obj) === constants.TYPES.Object;
}

function isFunction (obj) {
    return obj instanceof constants.TYPES.Function.ctor;
}

function isAsyncFunction (obj) {
    return getType(obj) === constants.TYPES.AsyncFunction;
}

function isGeneratorFunction (obj) {
    return getType(obj) === constants.TYPES.GeneratorFunction;
}

function isArray (obj) {
    return getType(obj) === constants.TYPES.Array;
}

function isPromise (obj) {
    return getType(obj) === constants.TYPES.Promise;
}

// Checks for forEach on prototype
// Array
// Map
// Set
// TypedArray
// Buffer
// Readable
// Transform
// Duplex
// PassThrough
// Iterator
// NodeList
function hasForEach (obj) {
    return getType(obj).each;
}

// Checks for @@iterator on prototype
// String
// Array
// Map
// Set
// TypedArray
// Array Iterator
// String Iterator
// Map Iterator
// Set Iterator
// Buffer
// Iterator
// NodeList
function isIterable (obj) {
    return getType(obj).iterable;
}

// Checks for entries on prototype
// Array
// Map
// Set
// TypedArray
// Buffer
// NodeList
function hasEntries (obj) {
    return getType(obj).entries;
}

// Array
// Map
// Set
// Array Iterator
// String Iterator
// Map Iterator
// Set Iterator
// Iterator
// NodeList
function isCollection (obj) {
    return getType(obj).collection;
}

function isIterator (obj) {
    return obj instanceof constants.TYPES.Iterator.ctor
}

function isTypedArray (obj) {
    return obj instanceof constants.TYPES.TypedArray.ctor;
}

function isBuffer (obj) {
    return getType(obj) === constants.TYPES.Buffer;
}

function isNumber (n) {
    return getType(n) === constants.TYPES.Number;
}

function isNumeric (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function toFn (fn) {
    return isFunction(fn) ? fn : constants.noop;
}

function toObject (obj) {
    let type = getType(obj);
    if (type === constants.TYPES.Object) {
        return obj;
    }
    if (type.entries) {
        // Note: @@iterator does not work
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
        return Object.fromEntries(obj.entries());
    }
    return {};
}

exports.getCtorType = getCtorType;
exports.getCtorTypeStr = getCtorTypeStr;
exports.getType = getType;
exports.getTypeFromCtor = getTypeFromCtor;
exports.getTypeFromProto = getTypeFromProto;
exports.getTypeStr = getTypeStr;
exports.hasEntries = hasEntries;
exports.hasForEach = hasForEach;
exports.isArray = isArray;
exports.isAsyncFunction = isAsyncFunction;
exports.isBuffer = isBuffer;
exports.isCollection = isCollection;
exports.isCtor = isCtor;
exports.isEsmMode = isEsmMode;
exports.isFunction = isFunction;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isIterable = isIterable;
exports.isIterator = isIterator;
exports.isModule = isModule;
exports.isNil = isNil;
exports.isNull = isNull;
exports.isNumber = isNumber;
exports.isNumeric = isNumeric;
exports.isObject = isObject;
exports.isPromise = isPromise;
exports.isTypedArray = isTypedArray;
exports.isUndefined = isUndefined;
exports.notNil = notNil;
exports.toFn = toFn;
exports.toObject = toObject;
exports.toType = toType;
