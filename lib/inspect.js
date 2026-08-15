import {
    addTypes,
    from,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
    getOwnPropertySymbols,
    getPrototypeOf,
    hasOwn,
    is,
    keys,
    TYPES,
    types
} from './constants.js';
import {
    getType,
    isAsyncIterator,
    isClass,
    isError,
    isIterator,
    isString,
    isTypedArray
} from './types.js';
import { web } from './types/base.js';

const { propertyIsEnumerable } = Object.prototype;

addTypes(web);

// Layout tuning
// indent: Spaces per depth level
// threshold: Max entry count per object (break to multiple lines)
// break: Max line width (break to multiple lines)
// gap: Inner padding after open / before close (inline)
// sep: Separator between entries (inline)
const LAYOUT = {
    indent: 2,
    threshold: 6,
    break: 72,
    gap: ' ',
    sep: ', '
};

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const INDEX = /^\d+$/;

const PROPS = {
    err: new Set([
        'stack',
        'message'
    ]),
    fn: new Set([
        'length',
        'name',
        'prototype'
    ]),
    url: [
        'href',
        'origin',
        'protocol',
        'username',
        'password',
        'host',
        'hostname',
        'port',
        'pathname',
        'search',
        'hash'
    ],
};

// Omit predicates
const OMIT = {
    err: prop => PROPS.err.has(prop),
    fn: prop => PROPS.fn.has(prop),
    index: prop => typeof prop === 'string' && (prop === 'length' || INDEX.test(prop))
};

// Logical style to color name in CODES
const STYLES = {
    special: 'cyan',
    number: 'yellow',
    bigint: 'yellow',
    boolean: 'yellow',
    undefined: 'grey',
    null: 'bold',
    string: 'green',
    symbol: 'green',
    date: 'magenta',
    regexp: 'red',
    module: 'underline'
};

// ANSI style codes [on, off]
const CODES = {
    bold: [1, 22],
    italic: [3, 23],
    underline: [4, 24],
    white: [37, 39],
    grey: [90, 39],
    black: [30, 39],
    blue: [34, 39],
    cyan: [36, 39],
    green: [32, 39],
    magenta: [35, 39],
    red: [31, 39],
    yellow: [33, 39]
};

// Wrap str in ANSI color codes
function stylize (ctx, str, color) {
    if (!ctx.colors) {
        return str;
    }
    let code = CODES[color];
    if (!code) {
        return str;
    }
    return `\x1b[${code[0]}m${str}\x1b[${code[1]}m`;
}

// Character escape ranges per quote style
// Note: Quote, backslash, C0 (0x00-0x1f, 0x7f), and C1 (0x80-0x9f) control ranges
const REGEX = {
    single: /['\\\x00-\x1f\x7f-\x9f]/g,
    double: /["\\\x00-\x1f\x7f-\x9f]/g
};

// Named escapes for common control characters (excludes \v)
const ESCAPES = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r'
};

// Escape a quote or control character
// Note: Leading slash if printable, named or \xNN for controls
function escape (char) {
    let code = char.charCodeAt(0);
    if (code >= 0x20 && code < 0x7f) {
        return '\\' + char;
    }
    return ESCAPES[char] || '\\x' + code.toString(16).toUpperCase().padStart(2, '0');
}

// Quote and escape a string
// Note: Prefers single quotes unless double quotting avoids escaping
function stringLiteral (str) {
    let q = "'";
    let regex = REGEX.single;
    // Note: Switch to double quotes when str has a single quote but no double
    if (str.includes("'") && !str.includes('"')) {
        q = '"';
        regex = REGEX.double;
    }
    return q + str.replace(regex, escape) + q;
}

// Format a number (preserving -0)
function number (val) {
    if (is(val, -0)) {
        return '-0';
    }
    return String(val);
}

// Format an object key (quotes and escapes if needed, supports symbols)
function key (val) {
    if (typeof val === 'symbol') {
        return `[${String(val)}]`;
    }
    if (IDENTIFIER.test(val)) {
        return val;
    }
    return stringLiteral(val);
}

// Constructor-name prefix for objects
// Note: Empty string for plain objects, custom tag for null prototype
function prefix (val) {
    let proto = getPrototypeOf(val);
    if (proto === null) {
        return '[Object: null prototype] ';
    }
    let name = proto.constructor && proto.constructor.name;
    if (!name || name === 'Object') {
        return '';
    }
    return name + ' ';
}

// Own keys for enumeration (showHidden adds non-enumerable names and symbols)
function ownKeys (obj, showHidden) {
    let names;
    if (showHidden) {
        names = getOwnPropertyNames(obj);
    } else {
        names = keys(obj);
    }
    let symbols = getOwnPropertySymbols(obj);
    if (!showHidden) {
        symbols = symbols.filter(s => propertyIsEnumerable.call(obj, s));
    }
    return names.concat(symbols);
}

// Format a nested value one extra level (restores depth)
function child (ctx, val) {
    ctx.depth++;
    try {
        return format(ctx, val);
    } finally {
        ctx.depth--;
    }
}

// Format a property as 'key: value' (getters/setters are shown, not invoked)
function property (ctx, obj, prop) {
    let desc = getOwnPropertyDescriptor(obj, prop);
    if (desc && (desc.get || desc.set)) {
        let label;
        if (desc.get && desc.set) {
            label = '[Getter/Setter]';
        } else if (desc.get) {
            label = '[Getter]';
        } else {
            label = '[Setter]';
        }
        return key(prop) + ': ' + stylize(ctx, label, STYLES.special);
    }
    // Note: Reuse the descriptor value
    return key(prop) + ': ' + child(ctx, desc ? desc.value : obj[prop]);
}

// Own properties as 'key: value' entries
// Note: Accepts an optional skip predicate as omit
function members (ctx, val, omit) {
    let entries = [];
    for (let prop of ownKeys(val, ctx.showHidden)) {
        if (omit && omit(prop)) {
            continue;
        }
        entries.push(property(ctx, val, prop));
    }
    return entries;
}

// Render entries as block, inline, or multiline based on LAYOUT
// Note: Join entries inline when shallow/small, otherwise break to one entry per line
function render (ctx, pre, braces, entries) {
    let [open, close] = braces;
    if (!entries.length) {
        return pre + open + close;
    }
    // Note: Break into multiple lines when too many entries, line too wide, or nested break
    let breaks = entries.length > LAYOUT.threshold;
    // Note: Fixed frame + indent size
    let shell = pre.length + open.length + close.length + 2 * LAYOUT.gap.length + ctx.depth * LAYOUT.indent;
    let width = shell + LAYOUT.sep.length * (entries.length - 1);
    if (!breaks) {
        for (let entry of entries) {
            if (entry.includes('\n')) {
                breaks = true;
                break;
            }
            width += entry.length;
        }
    }
    if (!breaks && width <= ctx.breakLength) {
        return pre + open + LAYOUT.gap + entries.join(LAYOUT.sep) + LAYOUT.gap + close;
    }
    let pad = ' '.repeat((ctx.depth + 1) * LAYOUT.indent);
    let end = ' '.repeat(ctx.depth * LAYOUT.indent);
    return pre + open + '\n' + entries.map(entry => pad + entry).join(',\n') + '\n' + end + close;
}

// Render a record block with named fields
// Note: ArrayBuffer, SharedArrayBuffer, DataView, URL
function record (ctx, pre, val, names) {
    return render(ctx, pre, ['{', '}'], names.map(n => property(ctx, val, n)));
}

// Render a labeled block with own props (Error, Function)
function labeled (ctx, base, entries) {
    if (!entries.length) {
        return base;
    }
    return render(ctx, base + ' ', ['{', '}'], entries);
}

// Abbreviated tag for a value beyond the max depth
function tag (ctx, val, type) {
    let name = type.name;
    if (type === TYPES.Object) {
        name = prefix(val).trim() || 'Object';
    }
    return stylize(ctx, `[${name}]`, STYLES.special);
}

// Build the [Function: name] or [class Name] label
function fnLabel (val, type) {
    if (isClass(val)) {
        let parent = getPrototypeOf(val);
        let ext = '';
        if (parent && parent !== TYPES.Function.proto && parent.name) {
            ext = ` extends ${parent.name}`;
        }
        return `[class ${val.name || '(anonymous)'}${ext}]`;
    }
    if (val.name) {
        return `[${type.name}: ${val.name}]`;
    }
    return `[${type.name} (anonymous)]`;
}

// Per-type formatters
const FMT = {
    // Array (includes sparse holes and extra own keys)
    array (ctx, val) {
        let entries = [];
        let holes = 0;
        let flush = () => {
            if (holes) {
                entries.push(stylize(ctx, `<${holes} empty item${holes > 1 ? 's' : ''}>`, STYLES.undefined));
                holes = 0;
            }
        };
        for (let i = 0; i < val.length; i++) {
            if (hasOwn(val, i)) {
                flush();
                entries.push(child(ctx, val[i]));
            } else {
                holes++;
            }
        }
        flush();
        // Note: Extra non-index own properties
        entries.push(...members(ctx, val, OMIT.index));
        return render(ctx, '', ['[', ']'], entries);
    },
    // Buffer as a hex byte string
    buffer (val) {
        let hex = from(val, b => b.toString(16).padStart(2, '0')).join(' ');
        return `<Buffer${hex ? ' ' + hex : ''}>`;
    },
    // Typed array
    typedArray (ctx, val, type) {
        if (TYPES.Buffer && type === TYPES.Buffer) {
            return FMT.buffer(val);
        }
        let entries = from(val, v => child(ctx, v));
        return render(ctx, `${type.name}(${val.length}) `, ['[', ']'], entries);
    },
    // Map
    map (ctx, val) {
        let entries = from(val, ([k, v]) => child(ctx, k) + ' => ' + child(ctx, v));
        return render(ctx, `Map(${val.size}) `, ['{', '}'], entries);
    },
    // Set
    set (ctx, val) {
        let entries = from(val, v => child(ctx, v));
        return render(ctx, `Set(${val.size}) `, ['{', '}'], entries);
    },
    // Plain object, class instance, or module namespace
    // Note: Accepts optional prefix override
    object (ctx, val, pre) {
        return render(ctx, pre ?? prefix(val), ['{', '}'], members(ctx, val));
    },
    // Error as stack (appends any extra own props)
    error (ctx, val) {
        let stack = val.stack;
        if (!isString(stack)) {
            stack = `${val.name}: ${val.message}`;
        }
        return labeled(ctx, stack, members(ctx, val, OMIT.err));
    },
    // Function or class (appends any extra own props)
    fn (ctx, val, type) {
        let base = stylize(ctx, fnLabel(val, type), STYLES.special);
        return labeled(ctx, base, members(ctx, val, OMIT.fn));
    }
};

// Non-recursing leaf types (not subject to maxDepth)
function special (ctx, val, type) {
    switch (type) {
        case TYPES.RegExp:
            return stylize(ctx, String(val), STYLES.regexp);
        case TYPES.Date:
            return stylize(ctx, isNaN(val.getTime()) ? 'Invalid Date' : val.toISOString(), STYLES.date);
        case TYPES.Promise:
            // Note: Promise state can't be introspected
            return 'Promise { ' + stylize(ctx, '<pending>', STYLES.special) + ' }';
        case TYPES.WeakMap:
        case TYPES.WeakSet:
        case TYPES.WeakRef:
            return `${type.name} { ` + stylize(ctx, '<items unknown>', STYLES.special) + ' }';
        case TYPES.ArrayBuffer:
        case TYPES.SharedArrayBuffer:
            return record(ctx, `${type.name} `, val, ['byteLength']);
        case TYPES.DataView:
            return record(ctx, 'DataView ', val, ['byteLength', 'byteOffset']);
        case TYPES.URL:
            return record(ctx, 'URL ', val, PROPS.url);
    }
}

// Route an object or function value to its formatter
function dispatch (ctx, val, type) {
    // Callables
    if (type.type === types[6]) {
        return FMT.fn(ctx, val, type);
    }
    if (isError(val)) {
        return FMT.error(ctx, val);
    }
    // Not subject to maxDepth
    if (isTypedArray(val)) {
        return FMT.typedArray(ctx, val, type);
    }
    // Non-recursing special leaves (not subject to maxDepth)
    let leaf = special(ctx, val, type);
    if (leaf !== undefined) {
        return leaf;
    }
    // Iterators/Generators (tag without consuming)
    if (isIterator(val) || isAsyncIterator(val)) {
        return stylize(ctx, `[${type.name}]`, STYLES.special);
    }
    // Recurse container types (subject to maxDepth)
    if (ctx.depth > ctx.maxDepth) {
        return tag(ctx, val, type);
    }
    switch (type) {
        case TYPES.Array:
            return FMT.array(ctx, val);
        case TYPES.Map:
            return FMT.map(ctx, val);
        case TYPES.Set:
            return FMT.set(ctx, val);
        case TYPES.Module:
            return FMT.object(ctx, val, '[Module: null prototype] ');
        default:
            return FMT.object(ctx, val);
    }
}

// Format any value (inline primitives, circular guard, and dispatch)
function format (ctx, val) {
    let type = getType(val);
    switch (type) {
        case TYPES.Undefined:
            return stylize(ctx, 'undefined', STYLES.undefined);
        case TYPES.Null:
            return stylize(ctx, 'null', STYLES.null);
        case TYPES.String:
            return stylize(ctx, stringLiteral(val), STYLES.string);
        case TYPES.Number:
        case TYPES.NaN:
        case TYPES.Infinity:
            return stylize(ctx, number(val), STYLES.number);
        case TYPES.BigInt:
            return stylize(ctx, String(val) + 'n', STYLES.bigint);
        case TYPES.Boolean:
            return stylize(ctx, String(val), STYLES.boolean);
        case TYPES.Symbol:
            return stylize(ctx, String(val), STYLES.symbol);
    }
    // Objects and functions
    if (ctx.seen.has(val)) {
        return stylize(ctx, '[Circular]', STYLES.special);
    }
    ctx.seen.add(val);
    try {
        return dispatch(ctx, val, type);
    } finally {
        ctx.seen.delete(val);
    }
}

// Format a value as human-readable string for logging and debugging
// colors: Enable ANSI color codes
// depth: Levels to expand nested values (null for infinity)
// showHidden: Include non-enumerable properties and symbols
// showProxy: No-op (proxies can't be detected from js)
export function inspect (obj, { colors=false, depth=2, showHidden=false, showProxy=false }={}) {
    let ctx = {
        colors,
        depth: 0,
        maxDepth: depth === null ? Infinity : depth,
        showHidden,
        showProxy,
        breakLength: LAYOUT.break,
        seen: new WeakSet()
    };
    return format(ctx, obj);
}
