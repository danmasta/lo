const getPrototypeOf = Object.getPrototypeOf;
const genFn = function*(){};
const asyncGenFn = async function*(){};

const types = [
    {
        t: 'undefined',
        n: 'Undefined',
        c: undefined,
        p: undefined,
        x: [0, 0, 0]
    },
    {
        t: 'object',
        n: 'Null',
        c: undefined,
        p: undefined,
        x: [0, 0, 0]
    },
    {
        t: 'boolean',
        n: 'Boolean',
        x: [1, 1, 1]
    },
    {
        t: 'number',
        n: 'Number',
        x: [1, 1, 1]
    },
    {
        t: 'number',
        n: 'NaN',
        c: Number,
        x: [0, 0, 0]
    },
    {
        t: 'number',
        n: 'Infinity',
        c: Number,
        x: [0, 0, 0]
    },
    {
        t: 'bigint',
        n: 'BigInt',
        x: [0, 1, 1]
    },
    {
        t: 'string',
        n: 'String',
        x: [1, 1, 1]
    },
    {
        t: 'symbol',
        n: 'Symbol',
        x: [0, 1, 1]
    },
    {
        t: 'function',
        n: 'Function',
        x: [1, 1, 2]
    },
    {
        t: 'object',
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
        n: 'Error',
        x: [1, 1, 2]
    },
    {
        n: 'ArrayBuffer',
        x: [1, 0, 2]
    },
    {
        n: 'DataView',
        x: [1, 0, 2]
    },
    {
        n: 'TypedArray',
        c: getPrototypeOf(Int8Array),
        x: [0, 0, 0],
        a: 1
    },
    {
        n: 'Int8Array',
        x: [1, 0, 2]
    },
    {
        n: 'Uint8Array',
        x: [1, 0, 2]
    },
    {
        n: 'Uint8ClampedArray',
        x: [1, 0, 2]
    },
    {
        n: 'Int16Array',
        x: [1, 0, 2]
    },
    {
        n: 'Uint16Array',
        x: [1, 0, 2]
    },
    {
        n: 'Int32Array',
        x: [1, 0, 2]
    },
    {
        n: 'Uint32Array',
        x: [1, 0, 2]
    },
    {
        n: 'Float32Array',
        x: [1, 0, 2]
    },
    {
        n: 'Float64Array',
        x: [1, 0, 2]
    },
    {
        n: 'BigInt64Array',
        x: [1, 0, 2]
    },
    {
        n: 'BigUint64Array',
        x: [1, 0, 2]
    },
    {
        n: 'Array Iterator',
        c: Array.prototype[Symbol.iterator],
        p: getPrototypeOf(Array.prototype[Symbol.iterator]()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'String Iterator',
        c: String.prototype[Symbol.iterator],
        p: getPrototypeOf(String.prototype[Symbol.iterator]()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'Map Iterator',
        c: Map.prototype[Symbol.iterator],
        p: getPrototypeOf(new Map().entries()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'Set Iterator',
        c: Set.prototype[Symbol.iterator],
        p: getPrototypeOf(new Set().entries()),
        x: [0, 1, 1, 1]
    },
    {
        n: 'Module',
        c: undefined,
        p: null,
        x: [0, 0, 0]
    },
    {
        n: 'Proxy',
        x: [1, 0, 2]
    },
    {
        n: 'FinalizationRegistry',
        x: [1, 0, 2]
    },
    {
        n: 'ReadableStream',
        x: [1, 0, 2]
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
        t: 'function',
        n: 'AsyncFunction',
        c: (async()=>{}).constructor,
        x: [1, 1, 2]
    },
    {
        t: 'function',
        n: 'GeneratorFunction',
        c: genFn.constructor,
        x: [1, 1, 2]
    },
    {
        t: 'function',
        n: 'AsyncGeneratorFunction',
        c: asyncGenFn.constructor,
        x: [1, 1, 2]
    },
    {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
        // Note: Generator.constructor is GeneratorFunction.prototype
        // Note: Generator is a subclass of Iterator
        // Note: getPrototypeOf(generator) !== generator.constructor.prototype
        n: 'Generator',
        c: genFn().constructor,
        x: [0, 0, 0, 1]
    },
    {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator
        // Note: AsyncGenerator.constructor is AsyncGeneratorFunction.prototype
        // Note: AsyncGenerator is a subclass of AsyncIterator
        // Note: getPrototypeOf(asyncgenerator) !== asyncgenerator.constructor.prototype
        n: 'AsyncGenerator',
        c: asyncGenFn().constructor,
        x: [0, 0, 0, 1]
    },
    {
        t: 'unknown',
        n: 'Unknown',
        x: [0, 0, 0]
    }
];

// Node v22.x+
if (typeof Iterator !== 'undefined') {
    types.push({
        n: 'Iterator',
        x: [0, 0, 0, 1],
        a: 1
    });
}

// Not implemented yet:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
if (typeof AsyncIterator !== 'undefined') {
    types.push({
        n: 'AsyncIterator',
        x: [0, 0, 0, 1],
        a: 1
    });
}

exports.default = types;
