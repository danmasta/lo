import base from '../types/base.js';

export const {
    entries,
    getOwnPropertyDescriptor,
    getPrototypeOf,
    hasOwn,
    isPrototypeOf
} = Object;

export const identity = val=>val;
export const noop = ()=>{};

export const BREAK = Symbol('break');
export const CLONE = Symbol('clone');
export const TYPE = Symbol('type');

export const SYMBOLS = {
    break: BREAK,
    clone: CLONE,
    type: TYPE,
    get: Symbol('get'),
    set: Symbol('set'),
    evicted: Symbol('evicted'),
    expired: Symbol('expired')
};

const Global = globalThis;

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
    let known, { n: name, c: ctor, p: proto, x, t: type=7, a: abstract } = obj;
    if (!name && ctor) {
        name = ctor.name;
    }
    if (!name || !x) {
        throw new Error('Type malformed');
    }
    // Not known if constructor unset and not found in global
    if (!hasOwn(obj, 'c')) {
        if (!hasOwn(Global, name)) {
            known = 0;
        }
        ctor = Global[name];
    }
    if (!hasOwn(obj, 'p')) {
        proto = ctor?.prototype;
    }
    return {
        type: types[type],
        name,
        ctor,
        proto,
        construct: !!x[0],
        call: !!x[1],
        create: x[2],
        collection: !!x[3],
        abstract: !!abstract,
        each: !!proto?.forEach,
        iterable: !!proto?.[Symbol.iterator],
        async: !!proto?.[Symbol.asyncIterator],
        entries: !!proto?.entries,
        known: known !== 0,
        object: type === 7 && name !== 'Null',
        [TYPE]: true
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

export function addType (type) {
    if (type.x) {
        type = genType(type);
    }
    if (!type.known) {
        return;
    }
    let { name, ctor, proto } = type;
    if (!TYPES[name]) {
        TYPES[name] = type;
    }
    if (ctor && !typesByCtor.has(ctor)) {
        typesByCtor.set(ctor, type);
    }
    if (proto && !typesByProto.has(proto)) {
        typesByProto.set(proto, type);
    }
    return type;
}

export function addTypes (types) {
    for (const [name, type] of entries(types)) {
        addType(type);
    }
}

// Initial types
export const TYPES = genTypes(base);

// Typeof
export const typesByType = new Map([
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

export const REGEX = {
    path: /[\[\]\."']+/g,
    words: /[\W_-]+|(?<=\p{Ll})(?=\p{Lu})/gu,
    whitespace: /\s+/g,
    fmt: /%([sdifjoOc%])/g,
    diacritics: /\p{Diacritic}/gu,
    html: /([&<>"'])/g,
    htmlEscaped: /&(amp|lt|gt|quot|#39);/g,
    eol: /\r\n|\r|\n/g
};

export const PRIMITIVES = {
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

export {
    identity as id
};
