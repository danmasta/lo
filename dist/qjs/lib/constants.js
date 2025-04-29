import types$1, { hasOwn } from '../types/base.js';
export { getPrototypeOf, isPrototypeOf } from '../types/base.js';

const noop = ()=>{};
const BREAK = Symbol();
const CLONE = Symbol();
const G = globalThis;

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
//     known: 0          // boolean (in globalThis)
//     object: 0         // boolean (object type and not null)
// };
// x = [construct, call, create, collection]
function genType (obj) {
    if (!obj.n || !obj.x) {
        throw new Error('Type malformed');
    }
    if (!hasOwn(obj, 'c')) {
        if (!hasOwn(G, obj.n)) {
            obj.k = 0;
        }
        obj.c = G[obj.n];
    }
    if (!hasOwn(obj, 'p')) {
        obj.p = obj.c?.prototype;
    }
    let t = obj.t ?? 7;
    return {
        type: types[t],
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
        entries: !!obj.p?.entries,
        known: obj.k !== 0,
        object: t === 7 && obj.n !== 'Null'
    };
}

// Generate inital types to use in cache refs
function genTypes (arr) {
    let res = {};
    arr.forEach(type => {
        type = genType(type);
        if (type.known) {
            res[type.name] = type;
        }
    });
    return res;
}

function addType (type) {
    if (type.x) {
        type = genType(type);
    }
    if (!type.known) {
        return;
    }
    let { name, proto, ctor } = type;
    if (!TYPES[name]) {
        TYPES[name] = type;
    }
    if (proto && !typesByProto.has(proto)) {
        typesByProto.set(proto, type);
    }
    if (ctor && !typesByCtor.has(ctor)) {
        typesByCtor.set(ctor, type);
    }
}

function addTypes (types) {
    for (const [name, type] of Object.entries(types)) {
        addType(type);
    }
}

// Initial types
const TYPES = genTypes(types$1);

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
    words: /[\W_-]+|(?<=\p{Ll})(?=\p{Lu})/gu,
    whitespace: /\s+/g,
    fmt: /%([sdifjoOc%])/g,
    diacritics: /\p{Diacritic}/gu,
    html: /([&<>"'])/g,
    htmlEscaped: /&(amp|lt|gt|quot|#39);/g,
    eol: /\r\n|\r|\n/g
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

// Add remaining types to cache refs
addTypes(TYPES);

export { BREAK, CLONE, PRIMITIVES, REGEX, TYPES, addType, addTypes, hasOwn, noop, typesByCtor, typesByProto, typesByType };
