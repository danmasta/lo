import { getPrototypeOf, typesByProto, TYPES, addType, isPrototypeOf, typesByCtor, typesByType, getOwnPropertyDescriptor, noop, REGEX, hasOwn, PRIMITIVES } from './constants.js';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
function toStringTag (obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

// Get the type definition from an object's prototype
// Will recurse 3 levels to check parent proto if recurse not explicitly false
// Will recurse the whole prototype chain if recurse is -1 or Infinity
// Returns TYPES.Unknown if type not found
function getTypeFromProto (obj, { recurse=3, of, add=1, ref=obj }={}) {
    let proto = getPrototypeOf(obj);
    let type = typesByProto.get(proto);
    if (type) {
        return type;
    }
    // Unknown class or subclass that resolves to object type
    if (proto && of === TYPES.Object && add) {
        return addType({
            c: ref.constructor,
            x: [1, 0, 2, 0]
        });
    }
    if (recurse) {
        recurse--;
        return getTypeFromProto(proto, { recurse, of, add, ref });
    }
    if (isPrototypeOf.call(Error.prototype, obj)) {
        return TYPES.Error;
    }
    if (type = TYPES[toStringTag(obj)]) {
        return type;
    }
    // Return unknown because null and undefined are technically known types
    return TYPES.Unknown;
}

// Get the type definition from a constructor function
// Will recurse 3 levels to check parent class if recurse not explicitly false
// Will recurse the whole prototype chain if recurse is -1 or Infinity
// Returns TYPES.Unknown if type not found
function getTypeFromCtor (obj, { recurse=3, of, add=1, ref=obj }={}) {
    let type = typesByCtor.get(obj);
    if (type) {
        return type;
    }
    let proto = getPrototypeOf(obj);
    // Unknown class or subclass
    if (isClass(obj) && (proto === TYPES.Function.proto || isClass(proto)) && add) {
        return addType({
            c: ref,
            x: [1, 0, 2, 0]
        });
    }
    // If obj is a constructor fn or class (but not a subclass or extends null)
    // It's prototype will be Function.prototype
    if (proto === TYPES.Function.proto) {
        return TYPES.Function;
    }
    if (recurse) {
        // If obj is a subclass, the constructor prototype will be the parent class:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
        recurse--;
        return getTypeFromCtor(proto, { recurse, of, add, ref });
    }
    // Because obj is a constructor fn we need to check obj.prototype
    if (isPrototypeOf.call(Error.prototype, obj.prototype)) {
        return TYPES.Error;
    }
    if (type = TYPES[toStringTag(obj)]) {
        return type;
    }
    // Return unknown because null and undefined are technically known types
    return TYPES.Unknown;
}

// Get the object type definition
// Uses typeof if possible otherwise checks the prototype
function getType (obj) {
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
            // Plain objects
            if (obj.constructor === type.ctor) {
                return type;
            }
            // TypedArrays
            // Module
            // Promise
            // Iterator
            // AsyncIterator
            // AsyncFunction
            // GeneratorFunction
            // AsyncGeneratorFunction
            // Generator
            // AsyncGenerator
            if (type = TYPES[obj[Symbol.toStringTag]]) {
                if (type === TYPES.Uint8Array && TYPES.Buffer && obj instanceof TYPES.Buffer.ctor) {
                    return TYPES.Buffer;
                }
                return type;
            }
            return getTypeFromProto(obj, { of: TYPES.Object });
        default:
            return type;
    }
}

// Get the type name string of an object
// returns toStringTag if type not found
function getTypeStr (obj) {
    let type = getType(obj);
    if (type === TYPES.Unknown) {
        return toStringTag(obj);
    }
    return type.name;
}

// Alias
function getCtorType (obj) {
    return getTypeFromCtor(obj);
}

// Get the type name string of a constructor function
// returns toStringTag if type not found
function getCtorTypeStr (obj) {
    let type = getCtorType(obj);
    if (type === TYPES.Unknown) {
        return toStringTag(obj);
    }
    return type.name;
}

// Cast object to a specific type via a constructor or factory function
// Note: Does not validate arguments
function toType (Type, obj, ...args) {
    let type = getType(obj);
    let ctor = getTypeFromCtor(Type);
    if (type === ctor) {
        return obj;
    }
    switch (ctor.create) {
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

function isClass (obj) {
    return isFunction(obj) && getOwnPropertyDescriptor(obj, 'prototype').writable === false;
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

// Test if running in an esm or cjs context
function isEsm () {
    return typeof module === 'undefined';
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object
function isModule (obj) {
    return getType(obj) === TYPES.Module;
}

function isObject (obj) {
    return getType(obj) === TYPES.Object;
}

// Regular or async
function isFunction (obj) {
    return obj instanceof TYPES.Function.ctor;
}

function isAsyncFunction (obj) {
    return getType(obj) === TYPES.AsyncFunction;
}

function isGeneratorFunction (obj) {
    return getType(obj) === TYPES.GeneratorFunction;
}

function isArray (obj) {
    return getType(obj) === TYPES.Array;
}

function isPromise (obj) {
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
// Generator
// NodeList
function hasForEach (obj) {
    return getType(obj).each;
}

// Checks for @@iterator
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
// Generator
// NodeList
function isIterable (obj) {
    return notNil(obj) && !!obj[Symbol.iterator];
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
// AsyncIterator
// Generator
// AsyncGenerator
// NodeList
function isCollection (obj) {
    return getType(obj).collection;
}

function isIterator (obj) {
    return obj instanceof TYPES.Iterator.ctor
}

function isTypedArray (obj) {
    return obj instanceof TYPES.TypedArray.ctor;
}

function isArrayBuffer (obj) {
    return getType(obj) === TYPES.ArrayBuffer;
}

function isNumber (obj) {
    return getType(obj) === TYPES.Number;
}

function isNumeric (obj) {
    return !isNaN(parseFloat(obj)) && isFinite(obj);
}

function isString (obj) {
    return getType(obj) === TYPES.String;
}

function isBoolean (obj) {
    return getType(obj) === TYPES.Boolean;
}

function isRegExp (obj) {
    return getType(obj) === TYPES.RegExp;
}

// Checks for @@asyncIterator
// AsyncGenerator
// Currently no built-in async iterables except ReadableStream
function isAsyncIterable (obj) {
    return notNil(obj) && !!obj[Symbol.asyncIterator];
}

function isError (obj) {
    return obj instanceof TYPES.Error.ctor
}

function toArrayOrSelf (obj, self) {
    if (isArray(obj)) {
        return obj;
    }
    if (isIterable(obj)) {
        return Array.from(obj);
    }
    return self ? obj : [obj];
}

// Return an array from one or more objects
// If multiple objects are passed they are concatenated into one array
// If an object is iterable it is merged into the array
function toArray (obj, ...args) {
    if (args.length === 0) {
        return isNil(obj) ? [] : toArrayOrSelf(obj);
    } else {
        args.unshift(obj);
        return Array.prototype.concat.call([], ...args.map(obj => {
            return toArrayOrSelf(obj, true);
        }));
    }
}

function toFn (obj) {
    return isFunction(obj) ? obj : noop;
}

// Note: Only iterables that implement entries can be cast to an object
// Note: @@iterator only works if [[IteratorKind]] is 'entries'
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
function toObject (obj) {
    let type = getType(obj);
    if (type === TYPES.Object) {
        return obj;
    }
    if (type.entries) {
        return Object.fromEntries(obj.entries());
    }
    if (type.object) {
        return obj;
    }
    return {};
}

function toPath (str) {
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

// Note: Supports all types including iterables and objects
function toString (obj) {
    let type = getType(obj);
    switch (type) {
        case TYPES.String:
            return obj;
        case TYPES.Object:
            return Object.entries(obj).toString();
        case TYPES.Date:
            return obj.toISOString();
        default:
            if (!type.proto) {
                return '';
            }
            if (type.proto.toString !== Object.prototype.toString) {
                return type.proto.toString.call(obj);
            }
            if (type.iterable) {
                return Array.from(obj).toString();
            }
    }
}

// Convert a string value to it's native type if possible
// Note: Doesn't convert BigInt (Errors with floats and math operations)
// Note: Doesn't convert Symbol
function toNativeType (val) {
    if (hasOwn(PRIMITIVES, val)) {
        return PRIMITIVES[val];
    }
    if (isNumeric(val)) {
        if (val > Number.MAX_SAFE_INTEGER || val < Number.MIN_SAFE_INTEGER) {
            return val;
        }
        return parseFloat(val);
    }
    return val;
}

export { getCtorType, getCtorTypeStr, getType, getTypeFromCtor, getTypeFromProto, getTypeStr, hasEntries, hasForEach, isArray, isArrayBuffer, isAsyncFunction, isAsyncIterable, isBoolean, isClass, isCollection, isCtor, isError, isEsm, isFunction, isGeneratorFunction, isIterable, isIterator, isModule, isNil, isNull, isNumber, isNumeric, isObject, isPromise, isRegExp, isString, isTypedArray, isUndefined, notNil, toArray, toFn, toNativeType, toObject, toPath, toString, toType };
