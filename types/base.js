const asyncFn = async ()=>{};
const genFn = function*(){};
const genFnAsync = async function*(){};
const iter = Symbol.iterator;
const ctor = 'constructor';
const proto = 'prototype';
const { hasOwn, isPrototypeOf, getPrototypeOf } = Object;

const types = [
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
        n: 'BigInt64Array',
        x: [1, 0, 2, 1]
    },
    {
        n: 'BigUint64Array',
        x: [1, 0, 2, 1]
    },
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
        t: 6,
        n: 'AsyncFunction',
        c: asyncFn[ctor],
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
    },
    {
        t: 8,
        n: 'Unknown',
        c: undefined,
        x: [0, 0, 0]
    },
    {
        n: 'URL',
        x: [1, 0, 2]
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
        // Not available in all contexts:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
        n: 'SharedArrayBuffer',
        x: [1, 0, 2]
    }
];

export {
    types as default, hasOwn, isPrototypeOf, getPrototypeOf
};
