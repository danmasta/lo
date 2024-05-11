import base from '../types/base.js';

export function noop () {}

export const BREAK = Symbol();

const g = globalThis;
export const hasOwn = Object.hasOwn;
export const getPrototypeOf = Object.getPrototypeOf;
export const isPrototypeOf = Object.isPrototypeOf;

// type = {
//     type: 'object',   // string
//     name: undefined,  // string
//     ctor: undefined,  // function
//     proto: undefined, // object
//     construct: 0,     // boolean
//     call: 0,          // boolean
//     create: 0,        // 0=none,1=call,2=construct
//     collection: 0,    // boolean
//     abstract: 0,      // boolean
//     each: 0,          // boolean (forEach)
//     iterable: 0,      // boolean (@@iterator)
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
        type: obj.t || 'object',
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

export function addType (type) {
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

export function addTypes (types) {
    if (Array.isArray(types)) {
        types.forEach(addType);
    } else {
        for (const [name, type] of Object.entries(types)) {
            addType(type);
        }
    }
}

export const TYPES = genTypes(base);

// Typeof
export const typesByType = new Map([
    ['undefined', TYPES.Undefined],
    ['boolean', TYPES.Boolean],
    ['number', TYPES.Number],
    ['bigint', TYPES.BigInt],
    ['string', TYPES.String],
    ['symbol', TYPES.Symbol],
    ['function', TYPES.Function],
    ['object', TYPES.Object]
]);

// Prototype
export const typesByProto = new Map([
    [null, TYPES.Object]
]);

// Constructor
export const typesByCtor = new Map([
    [undefined, TYPES.Undefined],
    [null, TYPES.Null],
    [NaN, TYPES.NaN],
    [Infinity, TYPES.Infinity],
    [-Infinity, TYPES.Infinity]
]);

addTypes(TYPES);
