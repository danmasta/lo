var base = require('../types/base.cjs');

const noop = ()=>{};
const BREAK = Symbol();

const g = globalThis;
const hasOwn = Object.hasOwn;
const getPrototypeOf = Object.getPrototypeOf;
const isPrototypeOf = Object.isPrototypeOf;
const types = {
    0: 'undefined',
    1: 'boolean',
    2: 'number',
    3: 'bigint',
    4: 'string',
    5: 'symbol',
    6: 'function',
    7: 'object',
    8: 'unknown'
};

// type = {
//     type: 7,          // int
//     name: undefined,  // string
//     ctor: undefined,  // constructor function
//     proto: undefined, // prototype
//     construct: 0,     // boolean
//     call: 0,          // boolean
//     create: 0,        // 0=none,1=call,2=construct
//     collection: 0,    // boolean
//     abstract: 0,      // boolean
//     each: 0,          // boolean (forEach)
//     iterable: 0,      // boolean (@@iterator)
//     async: 0,         // boolean (@@asyncIterator)
//     entries: 0        // boolean (entries)
// };
function genType (obj) {
    if (!obj.n || !obj.x) {
        throw new Error('Type malformed');
    }
    if (!hasOwn(obj, 'c')) {
        obj.c = g[obj.n];
    }
    if (!hasOwn(obj, 'p')) {
        obj.p = obj.c?.prototype;
    }
    return {
        type: types[obj.t] || types[7],
        name: obj.n,
        ctor: obj.c,
        proto: obj.p,
        construct: !!obj.x[0],
        call: !!obj.x[1],
        create: obj.x[2],
        collection: !!obj.x[3],
        abstract: !!obj.a,
        each: !!obj.p?.forEach,
        iterable: !!obj.p?.[Symbol.iterator],
        async: !!obj.p?.[Symbol.asyncIterator],
        entries: !!obj.p?.entries
    };
}

function genTypes (arr) {
    let res = {};
    arr.forEach(type => {
        res[type.n] = genType(type);
    });
    return res;
}

function addType (type) {
    if (type.x) {
        type = genType(type);
    }
    if (!TYPES[type.name]) {
        TYPES[type.name] = type;
    }
    if (type.proto && !typesByProto.has(type.proto)) {
        typesByProto.set(type.proto, type);
    }
    if (type.ctor && !typesByCtor.has(type.ctor)) {
        typesByCtor.set(type.ctor, type);
    }
}

function addTypes (types) {
    if (Array.isArray(types)) {
        types.forEach(addType);
    } else {
        for (const [name, type] of Object.entries(types)) {
            addType(type);
        }
    }
}

const TYPES = genTypes(base.default);

// Typeof
const typesByType = new Map([
    [types[0], TYPES.Undefined],
    [types[1], TYPES.Boolean],
    [types[2], TYPES.Number],
    [types[3], TYPES.BigInt],
    [types[4], TYPES.String],
    [types[5], TYPES.Symbol],
    [types[6], TYPES.Function],
    [types[7], TYPES.Object]
]);

// Prototype
const typesByProto = new Map([
    [null, TYPES.Object]
]);

// Constructor
const typesByCtor = new Map([
    [undefined, TYPES.Undefined],
    [null, TYPES.Null],
    [NaN, TYPES.NaN],
    [Infinity, TYPES.Infinity],
    [-Infinity, TYPES.Infinity]
]);

const REGEX = {
    path: /[\[\]\."']+/g,
    words: /[\W-_]+/g,
    whitespace: /\s+/g,
    format: /%([sdifjoOc%])/g
};

const PRIMITIVES = {
    undefined: undefined,
    null: null,
    NaN: NaN,
    Infinity: Infinity,
    '-Infinity': -Infinity,
    true: true,
    false: false
};

addTypes(TYPES);

exports.BREAK = BREAK;
exports.PRIMITIVES = PRIMITIVES;
exports.REGEX = REGEX;
exports.TYPES = TYPES;
exports.addType = addType;
exports.addTypes = addTypes;
exports.getPrototypeOf = getPrototypeOf;
exports.hasOwn = hasOwn;
exports.isPrototypeOf = isPrototypeOf;
exports.noop = noop;
exports.typesByCtor = typesByCtor;
exports.typesByProto = typesByProto;
exports.typesByType = typesByType;
