import { hasOwn, REGEX, TYPES } from './constants.js';
import { each, eachNotNil, everyNotNil, forOwn, map } from './iterate.js';
import { getType, isArray, isBoolean, isNil, isNumeric, isObject, isRegExp, notNil, toArray, toObject, toPath, toString } from './types.js';

// Return a flat array
export function flat (...args) {
    return toArray(...args).flat(Infinity);
}

// Return a compact array (null and undefined removed)
export function compact (...args) {
    return toArray(...args).filter(notNil);
}

// Return a flat and compact array
export function flatCompact (...args) {
    return flat(...args).filter(notNil);
}

export function concat (...args) {
    return Array.prototype.concat.call([], ...args);
}

// Recursively assign properties from sources to new object
// Does not override previously set values
// Uses final argument as default definition to 'pick' properties from
// Works for all iterables and objects
// Definition must be an object or iterable that implements entries
export function defaults (...args) {
    args = compact(args);
    let acc = {};
    let def = toObject(args.at(-1));
    function iterate (res, obj, def) {
        forOwn(obj, (val, key) => {
            if (hasOwn(def, key)) {
                if (isObject(def[key])) {
                    res[key] = iterate(toObject(res[key]), val, def[key]);
                } else {
                    if (!hasOwn(res, key) || (isNil(res[key]) && notNil(val))) {
                        res[key] = val;
                    }
                }
            }
        });
        return res;
    }
    each(args, obj => {
        iterate(acc, obj, def);
    });
    return acc;
}

// Assign values from multiple sources to res
// Source properties that resolve to nil are ignored if res value already exists
// Note: if res is not an object it is converted to one if possible
export function assign (res, ...args) {
    res = toObject(res);
    let def = isBoolean(args.at(-1)) ? args.pop() : false;
    eachNotNil(args, src => {
        forOwn(src, (val, key) => {
            if (!hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (notNil(val) && (!def || isNil(res[key]))) {
                    res[key] = val;
                }
            }
        });
    });
    return res;
}

// Recursively assign values from multiple sources to res
// Source properties that resolve to nil are ignored if res value already exists
// Note: if res is not an object it is converted to one if possible
// Note: arrays are not merged
export function merge (res, ...args) {
    res = toObject(res);
    let def = isBoolean(args.at(-1)) ? args.pop() : false;
    eachNotNil(args, src => {
        forOwn(src, (val, key) => {
            if (!hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (isObject(res[key]) && isObject(val)) {
                    res[key] = merge(res[key], val);
                } else {
                    if (notNil(val) && (!def || isNil(res[key]))) {
                        res[key] = val;
                    }
                }
            }
        });
    });
    return res;
}

// Recursively freeze an object to become immutable
// Note: Circular references are ignored
export function freeze (obj, recurse=1, refs) {
    if (recurse) {
        refs = refs || new WeakSet();
        forOwn(obj, val => {
            if (typeof val === 'object' && val !== null && !refs.has(val)) {
                refs.add(val);
                freeze(val, recurse, refs);
            }
        });
    }
    return Object.freeze(obj);
}

export function getOwn (obj, key) {
    if (notNil(obj) && hasOwn(obj, key)) {
        return obj[key];
    }
}

export function setOwn (obj, key, val) {
    if (notNil(obj)) {
        return obj[key] = val;
    }
}

export function has (obj, path) {
    if (notNil(obj)) {
        return everyNotNil(toPath(path), key => {
            if (hasOwn(obj, key)) {
                obj = obj[key];
            } else {
                return false;
            }
        });
    }
    return false;
}

export function get (obj, path, def) {
    if (notNil(obj)) {
        let found = everyNotNil(toPath(path), key => {
            if (!hasOwn(obj, key)) {
                return false;
            } else {
                obj = obj[key];
            }
        });
        if (!found || isNil(obj)) {
            return def;
        }
        return obj;
    }
}

export function set (obj, path, val) {
    let cur = obj;
    if (isObject(obj) || isArray(obj)) {
        each(toPath(path), (key, index, arr) => {
            if (index === arr.length - 1) {
                cur[key] = val;
            } else {
                if (hasOwn(cur, key)) {
                    if (isObject(cur[key])) {
                        cur = cur[key];
                    } else {
                        if (isNumeric(arr[index + 1])) {
                            cur = cur[key] = isArray(cur[key]) ? cur[key] : [];
                        } else {
                            cur = cur[key] = {};
                        }
                    }
                } else {
                    cur = cur[key] = isNumeric(arr[index + 1]) ? [] : {};
                }
            }
        });
    }
    return obj;
}

export function keys (obj) {
    if (notNil(obj)) {
        return Object.keys(obj);
    }
    return [];
}

export function join (obj, sep=',') {
    if (notNil(obj)) {
        return Array.prototype.join.call(obj, toString(sep));
    }
    return '';
}

// Split string on char
// Limit sets the number of sub strings in result:
// Any remaining matches are included in final sub string
// Optionally trim results
// Note: Empty strings are ignored
// Note: Supports regex, global flag will be added if doesn't exist
export function split (str, char, { limit=Infinity, trim, inclusive=0 }={}) {
    str = toString(str);
    // Handle split on each character
    if (char === '') {
        return str.split(char);
    }
    let index = 0;
    let match;
    let sub = '';
    let res = [];
    let push = () => {
        if (trim) {
            sub = sub.trim();
        }
        // Ignore empty strings
        if (sub.length) {
            res.push(sub);
        }
    }
    if (isRegExp(char)) {
        if (char.flags.indexOf('g') === -1) {
            char = new RegExp(char.source, char.flags + 'g');
        }
        while ((match = char.exec(str)) !== null) {
            if (!limit) {
                break;
            }
            if (match[0]) {
                sub = str.slice(index, match.index);
                push();
                index = char.lastIndex;
            } else {
                // Handle empty match
                if (index !== match.index) {
                    sub = str.slice(index, match.index);
                    push();
                    // If match is zero length, lastIndex won't increment
                    index = char.lastIndex++;
                }
            }
            limit--;
        }
    } else {
        while ((match = str.indexOf(char, index)) > -1) {
            if (!limit) {
                break;
            }
            // Ignore empty match
            if (index !== match) {
                sub = str.slice(index, match);
                push();
            }
            limit--;
            index = match + char.length;
        }
    }
    if (index < str.length) {
        sub = str.slice(index);
        push();
    }
    return res;
}

export function toPairs (obj) {
    return map(obj, (val, key) => {
        return [key, val];
    }, 0);
}

export function fromPairs (arr) {
    let res = {};
    each(arr, pair => {
        res[pair[0]] = pair[1];
    });
    return res;
}

// Uppercase
export function toUpper (str) {
    return toString(str).toUpperCase();
}

// Lowercase
export function toLower (str) {
    return toString(str).toLowerCase();
}

function toCase (str, head=str=>str, tail=str=>str) {
    str = toString(str);
    let char = str.codePointAt(0) ?? -1;
    if (char === -1) {
        return str;
    }
    let i = char > 0xFFFF ? 2 : 1;
    return head(String.fromCodePoint(char)) + tail(str.slice(i));
}

export function capitalize (str) {
    return toCase(str, toUpper, toLower);
}

export function toUpperFirst (str) {
    return toCase(str, toUpper);
}

export function toLowerFirst (str) {
    return toCase(str, toLower);
}

// https://tc39.es/ecma262/multipage/text-processing.html#table-binary-unicode-properties
export function deburr (str) {
    return toString(str).normalize('NFD').replace(REGEX.diacritics, '');
}

// // https://unicode.org/reports/tr44/#GC_Values_Table
export function words (str) {
    return split(str, REGEX.words);
}

function compound (str, fn=val=>val, sep='') {
    return join(map(words(str), fn), sep);
}

// Uppercase, space separated
export function toUpperCase (str) {
    return compound(str, toUpper, ' ');
}

// Lowercase, space separated
export function toLowerCase (str) {
    return compound(str, toLower, ' ');
}

export function toCamelCase (str) {
    return compound(str, (val, i) => {
        return i ? capitalize(val) : toLower(val);
    });
}

export function toKebabCase (str) {
    return compound(str, toLower, '-');
}

export function toSnakeCase (str) {
    return compound(str, toLower, '_');
}

export function toPascalCase (str) {
    return compound(str, capitalize);
}

export function toStartCase (str) {
    return compound(str, capitalize, ' ');
}

const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    'amp': '&',
    'lt': '<',
    'gt': '>',
    'quot': '"',
    '#39': "'"
};

export function escapeHTML (str) {
    str = toString(str);
    return str.replace(REGEX.html, (match, char) => {
        return htmlEscapes[char];
    });
}

export function unescapeHTML (str) {
    str = toString(str);
    return str.replace(REGEX.htmlEscaped, (match, char) => {
        return htmlEscapes[char];
    });
}

export function pad (str, len=0, char) {
    str = toString(str);
    if (len <= str.length) {
        return str;
    }
    let dif = len - str.length;
    return str.padStart(str.length + Math.floor(dif / 2), char).padEnd(len, char);
}

export function padLeft (str, len=0, char) {
    return toString(str).padStart(len, char);
}

export function padRight (str, len=0, char) {
    return toString(str).padEnd(len, char);
}

export function trim (str) {
    return toString(str).trim();
}

export function trimLeft (str) {
    return toString(str).trimStart();
}

export function trimRight (str) {
    return toString(str).trimEnd();
}

// Note: Replaces circular references with '[Circular]'
function JSONReplacer () {
    let refs = new WeakSet();
    return (key, val) => {
        if (typeof val === 'object' && val !== null) {
            if (refs.has(val)) {
                return '[Circular]';
            }
            refs.add(val);
        }
        return val;
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/console/dir_static
// https://nodejs.org/api/util.html#utilinspectobject-options
// https://github.com/nodejs/node/blob/main/lib/internal/util/inspect.js#L847
// Get props or get props + non-enumerable props
//     If showHidden is true, include symbols
//     Otherwise filter enumerable properties only
// Get type name
// Format by type:
//     Array
//     Set
//     Map
//     TypedArray
//     Map Iterator
//     Set Iterator
//     Object
//     Arguments
//     Function
//     RegExp
//     Date (toISOString)
//     Error
//     ArrayBuffer
//     DataView
//     Promise
//     WeakSet
//     WeakMap
//     Module
//     Primitives
// Handle circular references
// export function inspect (obj, { colors=false, depth=2, showHidden=false }={}) {
//     let type = getType(obj);
// }

export function format (str, ...args) {
    str = toString(str);
    return str.replace(REGEX.format, (match, char) => {
        // Handle escape
        if (char === '%') {
            return char;
        }
        // If no corresponding argument don't replace
        if (!args.length) {
            return match;
        }
        let val = args.shift();
        let type = getType(val);
        switch (char) {
            case 's':
                return toString(val);
            case 'd':
            case 'i':
            case 'f':
                if (type === TYPES.BigInt) {
                    return toString(val);
                }
                if (type === TYPES.Symbol) {
                    return NaN;
                }
            case 'd':
                return Number(val);
            case 'i':
                return parseInt(val, 10);
            case 'f':
                return parseFloat(val);
            case 'j':
                return JSON.stringify(val, JSONReplacer(), 0);
            // Not implemented yet
            // Note: Full object including non-enumerable properties and proxies
            case 'o':
                return toString(val);
            // Not implemented yet
            // Note: Full object not including non-enumerable properties and proxies
            case 'O':
                return toString(val);
            case 'c':
                return '';
            default:
                return match;
        }
    });
}

export { hasOwn } from './constants.js';
export { format as fmt };
