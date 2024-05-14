import { TYPES, noop, typesByType, typesByProto, typesByCtor, getPrototypeOf, isPrototypeOf, REGEX } from './constants.js';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
function toStringTag (obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

// Get the type definition from an object's prototype
// Will recurse 1 level to check parent proto if recurse not explicitly false
// Will recurse the whole prototype chain if recurse is true
export function getTypeFromProto (obj, recurse) {
    let type = typesByProto.get(getPrototypeOf(obj));
    if (type) {
        return type;
    }
    if (recurse !== false) {
        // Check the parent prototype
        return getTypeFromProto(obj.constructor.prototype, recurse === true);
    }
    if (isPrototypeOf.call(Error.prototype, obj)) {
        return TYPES.Error;
    }
    if (TYPES[type = toStringTag(obj)]) {
        return TYPES[type];
    }
    // What to return if not found? Undefined, TYPES.Undefined, or StringTag?
    // Need to test for not found states
    return type;
}

// Get the type definition from constructor function
export function getTypeFromCtor (obj, recurse) {
    let type = typesByCtor.get(obj);
    if (type) {
        return type;
    }
    if (recurse !== false) {
        // If subclass the constructor prototype will be the parent class
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
        return getTypeFromCtor(getPrototypeOf(obj), false);
    }
    if (isPrototypeOf.call(Error.prototype, obj.prototype)) {
        return TYPES.Error;
    }
    // Not sure which is more accurate yet
    // Regular classes will have a constructor of Function
    // return getTypeFromCtor(obj.constructor);
    if (TYPES[type = toStringTag(obj)]) {
        return TYPES[type];
    }
    return type;
}

// Get the object type definition
// Uses typeof if possible otherwise checks it's prototype
export function getType (obj) {
    let type = typesByType.get(typeof obj);
    switch (type) {
        case TYPES.Function:
            if (obj.constructor !== TYPES.Function.ctor) {
                return getTypeFromProto(obj);
            }
            return type;
        case TYPES.Number:
            if (Number.isNaN(obj)) {
                return TYPES.NaN;
            }
            if (obj === Infinity || obj === -Infinity) {
                return TYPES.Infinity;
            }
            return type;
        case TYPES.Object:
            if (obj === null) {
                return TYPES.Null;
            }
            if (Array.isArray(obj)) {
                return TYPES.Array;
            }
            // TypedArrays
            // Module
            if (obj[Symbol.toStringTag] && TYPES[type = obj[Symbol.toStringTag]]) {
                return TYPES[type];
            }
            return getTypeFromProto(obj);
        default:
            return type;
    }
}

export function getTypeStr (obj) {
    return (obj = getType(obj))?.name ? obj.name : toStringTag(obj);
}

export function getCtorType (obj) {
    return getTypeFromCtor(obj);
}

export function getCtorTypeStr (obj) {
    return (obj = getCtorType(obj))?.name ? obj.name : toStringTag(obj);
}

// Convert object to a specific type via a constructor or factory function
// Note: Does not validate arguments
export function toType (Type, obj, ...args) {
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
export function isCtor (Fn) {
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

export function isNil (obj) {
    return obj == null;
}

export function notNil (obj) {
    return obj != null;
}

export function isNull (obj) {
    return obj === null;
}

export function isUndefined (obj) {
    return obj === undefined;
}

// Test if running in esm or commonjs mode
export function isEsmMode () {
    return typeof module === 'undefined';
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object
export function isModule (obj) {
    return getType(obj) === TYPES.Module;
}

export function isObject (obj) {
    return getType(obj) === TYPES.Object;
}

export function isFunction (obj) {
    return obj instanceof TYPES.Function.ctor;
}

export function isAsyncFunction (obj) {
    return getType(obj) === TYPES.AsyncFunction;
}

export function isGeneratorFunction (obj) {
    return getType(obj) === TYPES.GeneratorFunction;
}

export function isArray (obj) {
    return getType(obj) === TYPES.Array;
}

export function isPromise (obj) {
    return getType(obj) === TYPES.Promise;
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
export function hasForEach (obj) {
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
export function isIterable (obj) {
    return getType(obj).iterable;
}

// Checks for entries on prototype
// Array
// Map
// Set
// TypedArray
// Buffer
// NodeList
export function hasEntries (obj) {
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
export function isCollection (obj) {
    return getType(obj).collection;
}

export function isIterator (obj) {
    return obj instanceof TYPES.Iterator.ctor
}

export function isTypedArray (obj) {
    return obj instanceof TYPES.TypedArray.ctor;
}

export function isBuffer (obj) {
    return getType(obj) === TYPES.Buffer;
}

export function isNumber (obj) {
    return getType(obj) === TYPES.Number;
}

export function isNumeric (obj) {
    return !isNaN(parseFloat(obj)) && isFinite(obj);
}

export function isString (obj) {
    return getType(obj) === TYPES.String;
}

export function isBoolean (obj) {
    return getType(obj) === TYPES.Boolean;
}

export function toFn (obj) {
    return isFunction(obj) ? obj : noop;
}

export function toObject (obj) {
    let type = getType(obj);
    if (type === TYPES.Object) {
        return obj;
    }
    if (type.entries) {
        // Note: @@iterator does not work
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
        return Object.fromEntries(obj.entries());
    }
    return {};
}

export function toString (obj) {
    return isString(obj) ? obj : '';
}

export function toPath (str) {
    if (isArray(str)) {
        return str;
    }
    let arr = toString(str).split(REGEX.path);
    if (!arr.at(0)) {
        arr.shift();
    }
    if (!arr.at(-1)) {
        arr.pop();
    }
    return arr;
}
