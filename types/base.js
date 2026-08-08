const fn = ()=>{};
const fnAsync = async ()=>{};
const genFn = function*(){};
const genFnAsync = async function*(){};
const iter = Symbol.iterator;
const ctor = 'constructor';
const proto = 'prototype';
const { getPrototypeOf } = Object;

// Logical type groups
// Each group is an opt-in unit that can be registered independently via addTypes
// Note: Order is significant: Number must precede NaN and Infinity
// because they share a constructor and prototype

// Primitives, sentinels, and fundamental data types
// Note: Always registered
export const core = [
    {
        t: 0,
        n: 'Undefined',
        c: undefined,
        p: undefined,
        x: [0, 0, 0]
    },
    {
        n: 'Null',
        c: undefined,
        p: undefined,
        x: [0, 0, 0]
    },
    {
        t: 1,
        n: 'Boolean',
        x: [1, 1, 1]
    },
    {
        t: 2,
        n: 'Number',
        x: [1, 1, 1]
    },
    {
        t: 2,
        n: 'NaN',
        c: Number,
        x: [0, 0, 0]
    },
    {
        t: 2,
        n: 'Infinity',
        c: Number,
        x: [0, 0, 0]
    },
    {
        t: 3,
        n: 'BigInt',
        x: [0, 1, 1]
    },
    {
        t: 4,
        n: 'String',
        x: [1, 1, 1]
    },
    {
        t: 5,
        n: 'Symbol',
        x: [0, 1, 1]
    },
    {
        t: 6,
        n: 'Function',
        c: fn[ctor],
        x: [1, 1, 2]
    },
    {
        n: 'Object',
        x: [1, 1, 2]
    },
    {
        n: 'Array',
        x: [1, 1, 2, 1]
    },
    {
        n: 'RegExp',
        x: [1, 1, 2]
    },
    {
        n: 'Date',
        x: [1, 1, 2]
    },
    {
        n: 'Promise',
        x: [1, 0, 2]
    },
    {
        n: 'Error',
        x: [1, 1, 2]
    },
    {
        n: 'Proxy',
        x: [1, 0, 2]
    },
    {
        n: 'Module',
        c: undefined,
        p: null,
        x: [0, 0, 0]
    },
    {
        t: 8,
        n: 'Unknown',
        c: undefined,
        x: [0, 0, 0]
    }
];

// Native error subtypes (base Error in core)
export const errors = [
    {
        n: 'TypeError',
        x: [1, 1, 2]
    },
    {
        n: 'RangeError',
        x: [1, 1, 2]
    },
    {
        n: 'ReferenceError',
        x: [1, 1, 2]
    },
    {
        n: 'SyntaxError',
        x: [1, 1, 2]
    },
    {
        n: 'EvalError',
        x: [1, 1, 2]
    },
    {
        n: 'URIError',
        x: [1, 1, 2]
    },
    {
        n: 'AggregateError',
        x: [1, 1, 2]
    }
];

// Keyed, weak, and GC collections
export const collections = [
    {
        n: 'Map',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Set',
        x: [1, 0, 2, 1]
    },
    {
        n: 'WeakMap',
        x: [1, 0, 2]
    },
    {
        n: 'WeakSet',
        x: [1, 0, 2]
    },
    {
        n: 'WeakRef',
        x: [1, 0, 2]
    },
    {
        n: 'FinalizationRegistry',
        x: [1, 0, 2]
    }
];

// Binary buffers, views, and typed arrays
export const binary = [
    {
        n: 'ArrayBuffer',
        x: [1, 0, 2]
    },
    {
        // Not available in all contexts:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
        n: 'SharedArrayBuffer',
        x: [1, 0, 2]
    },
    {
        n: 'DataView',
        x: [1, 0, 2]
    },
    {
        n: 'TypedArray',
        c: getPrototypeOf(Int8Array),
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        n: 'Int8Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Uint8Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Uint8ClampedArray',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Int16Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Uint16Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Int32Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Uint32Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Float32Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Float64Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Float16Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'BigInt64Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'BigUint64Array',
        x: [1, 0, 2, 1]
    }
];

// Iterator protocol types and generator result objects
export const iterators = [
    {
        n: 'Array Iterator',
        c: Array[proto][iter],
        p: getPrototypeOf(Array[proto][iter]()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'String Iterator',
        c: String[proto][iter],
        p: getPrototypeOf(String[proto][iter]()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'Map Iterator',
        c: Map[proto][iter],
        p: getPrototypeOf(new Map().entries()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'Set Iterator',
        c: Set[proto][iter],
        p: getPrototypeOf(new Set().entries()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'RegExp String Iterator',
        c: String[proto].matchAll,
        p: getPrototypeOf(''.matchAll(/(?:)/g)),
        x: [0, 1, 1, 1]
    },
    {
        // Node v22.x+
        n: 'Iterator',
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        // Not implemented yet:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
        n: 'AsyncIterator',
        x: [0, 0, 0, 1],
        a: 1
    },
    {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
        // Note: Generator.constructor is GeneratorFunction.prototype
        // Note: Generator is a subclass of Iterator
        // Note: getPrototypeOf(generator) !== generator.constructor.prototype
        n: 'Generator',
        c: genFn()[ctor],
        x: [0, 0, 0, 1]
    },
    {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator
        // Note: AsyncGenerator.constructor is AsyncGeneratorFunction.prototype
        // Note: AsyncGenerator is a subclass of AsyncIterator
        // Note: getPrototypeOf(asyncgenerator) !== asyncgenerator.constructor.prototype
        n: 'AsyncGenerator',
        c: genFnAsync()[ctor],
        x: [0, 0, 0, 1]
    }
];

// Async and generator function subtypes (base Function in core)
export const functions = [
    {
        t: 6,
        n: 'AsyncFunction',
        c: fnAsync[ctor],
        x: [1, 1, 2]
    },
    {
        t: 6,
        n: 'GeneratorFunction',
        c: genFn[ctor],
        x: [1, 1, 2]
    },
    {
        t: 6,
        n: 'AsyncGeneratorFunction',
        c: genFnAsync[ctor],
        x: [1, 1, 2]
    }
];

// Web platform types: URL, fetch, and streams
export const web = [
    {
        n: 'URL',
        x: [1, 0, 2]
    },
    {
        n: 'URLSearchParams',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Request',
        x: [1, 0, 2]
    },
    {
        n: 'Response',
        x: [1, 0, 2]
    },
    {
        n: 'Headers',
        x: [1, 0, 2, 1]
    },
    {
        n: 'Blob',
        x: [1, 0, 2]
    },
    {
        n: 'File',
        x: [1, 0, 2]
    },
    {
        n: 'FormData',
        x: [1, 0, 2, 1]
    },
    {
        n: 'ReadableStream',
        x: [1, 0, 2, 1]
    },
    {
        n: 'WritableStream',
        x: [1, 0, 2]
    },
    {
        n: 'TransformStream',
        x: [1, 0, 2]
    },
    {
        n: 'CompressionStream',
        x: [1, 0, 2]
    },
    {
        n: 'DecompressionStream',
        x: [1, 0, 2]
    },
    {
        n: 'TextEncoder',
        x: [1, 0, 2]
    },
    {
        n: 'TextDecoder',
        x: [1, 0, 2]
    },
    {
        n: 'AbortController',
        x: [1, 0, 2]
    },
    {
        // Not constructable (created via AbortController or static methods)
        n: 'AbortSignal',
        x: [0, 0, 0]
    },
    {
        n: 'EventTarget',
        x: [1, 0, 2]
    },
    {
        n: 'Event',
        x: [1, 0, 2]
    },
    {
        n: 'CustomEvent',
        x: [1, 0, 2]
    },
    {
        n: 'DOMException',
        x: [1, 0, 2]
    },
    {
        n: 'MessageChannel',
        x: [1, 0, 2]
    },
    {
        // Not constructable (created via MessageChannel)
        // Note: Inherits EventTarget's toStringTag (instances resolve to EventTarget)
        n: 'MessagePort',
        x: [0, 0, 0]
    },
    {
        n: 'BroadcastChannel',
        x: [1, 0, 2]
    }
];

export const extended = [
    ...errors,
    ...collections,
    ...binary,
    ...iterators,
    ...functions,
    ...web
];

// Full table
export const all = [
    ...core,
    ...extended
];

export default all;
