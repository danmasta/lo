import { base } from './types/base.js';

export const {
    entries,
    fromEntries,
    getOwnPropertyDescriptor,
    getPrototypeOf,
    hasOwn,
    isPrototypeOf,
    values
} = Object;

export const { from } = Array;

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

export const settings = {
    addUnknownTypes: false
};

export const types = {
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
    let { n: name, c: ctor, p: proto, x, t: type=7, a: abstract } = obj;
    let known = true;
    if (!name && ctor) {
        name = ctor.name;
    }
    if (!name || !x) {
        throw new Error('Type malformed');
    }
    // Resolve ctor from global if not provided
    if (!hasOwn(obj, 'c')) {
        known = hasOwn(globalThis, name);
        ctor = globalThis[name];
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
        known,
        object: type === 7 && name !== 'Null',
        [TYPE]: true
    };
}

export function addType (type) {
    if (type.x) {
        type = genType(type);
    }
    if (!type.known) {
        return;
    }
    let { name, ctor, proto } = type;
    if (!REGISTRY.name[name]) {
        REGISTRY.name[name] = type;
    }
    if (ctor && !REGISTRY.ctor.has(ctor)) {
        REGISTRY.ctor.set(ctor, type);
    }
    if (proto && !REGISTRY.proto.has(proto)) {
        REGISTRY.proto.set(proto, type);
    }
    return type;
}

export function addTypes (types) {
    for (const type of values(types)) {
        addType(type);
    }
}

// Type registry
// Note: Indexed by name, typeof, prototype, and constructor
export const REGISTRY = {
    name: {},
    type: new Map(),
    proto: new Map(),
    ctor: new Map()
};

// Property access by name (TYPES.Array)
export const TYPES = REGISTRY.name;

// Registry lookups
export function typeByName (name) {
    return REGISTRY.name[name];
}

export function typeByType (type) {
    return REGISTRY.type.get(type);
}

export function typeByProto (proto) {
    return REGISTRY.proto.get(proto);
}

export function typeByCtor (ctor) {
    return REGISTRY.ctor.get(ctor);
}

export const REGEX = {
    path: /[\[\]\."']+/g,
    words: /[\W_-]+|(?<=\p{Ll})(?=\p{Lu})/gu,
    whitespace: /\s+/g,
    fmt: /%([sdifjoOc%])/g,
    diacritics: /\p{Diacritic}/gu,
    html: /([&<>"'])/g,
    htmlEscaped: /&(amp|lt|gt|quot|#39);/g,
    eol: /\r\n|\r|\n/g,
    absolute: /^(?:\/|\\\\|[a-zA-Z]:[\\/])/
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

// Register default type set
// Note: Seed special cases that can't be derived from descriptors
addTypes(base);

REGISTRY.type
    .set(types[0], TYPES.Undefined)
    .set(types[1], TYPES.Boolean)
    .set(types[2], TYPES.Number)
    .set(types[3], TYPES.BigInt)
    .set(types[4], TYPES.String)
    .set(types[5], TYPES.Symbol)
    .set(types[6], TYPES.Function)
    .set(types[7], TYPES.Object);

REGISTRY.proto.set(null, TYPES.Object);

REGISTRY.ctor
    .set(undefined, TYPES.Undefined)
    .set(null, TYPES.Null)
    .set(NaN, TYPES.NaN)
    .set(Infinity, TYPES.Infinity)
    .set(-Infinity, TYPES.Infinity);

export {
    identity as id
};
