var constants = require('./constants.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');
var base = require('../types/base.cjs');

// Return a flat array
function flat (...args) {
    return types.toArray(...args).flat(Infinity);
}

// Return a compact array (null and undefined removed)
function compact (...args) {
    return types.toArray(...args).filter(types.notNil);
}

// Return a flat and compact array
function flatCompact (...args) {
    return flat(...args).filter(types.notNil);
}

function concat (...args) {
    return Array.prototype.concat.call([], ...args);
}

// Recursively assign properties from sources to new object
// Does not override previously set values
// Uses final argument as default definition to 'pick' properties from
// Works for all iterables and objects
// Definition must be an object or iterable that implements entries
function defaults (...args) {
    args = compact(args);
    let acc = {};
    let def = types.toObject(args.at(-1));
    function iterate$1 (res, obj, def) {
        iterate.forOwn(obj, (val, key) => {
            if (base.hasOwn(def, key)) {
                if (types.isObject(def[key])) {
                    res[key] = iterate$1(types.toObject(res[key]), val, def[key]);
                } else {
                    if (!base.hasOwn(res, key) || (types.isNil(res[key]) && types.notNil(val))) {
                        res[key] = val;
                    }
                }
            }
        });
        return res;
    }
    iterate.each(args, obj => {
        iterate$1(acc, obj, def);
    });
    return acc;
}

// Assign values from multiple sources to res
// Source properties that resolve to nil are ignored if res value already exists
// Note: if res is not an object it is converted to one if possible
function assign (res, ...args) {
    res = types.toObject(res);
    let def = types.isBoolean(args.at(-1)) ? args.pop() : false;
    iterate.eachNotNil(args, src => {
        iterate.forOwn(src, (val, key) => {
            if (!base.hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (types.notNil(val) && (!def || types.isNil(res[key]))) {
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
function merge (res, ...args) {
    res = types.toObject(res);
    let def = types.isBoolean(args.at(-1)) ? args.pop() : false;
    iterate.eachNotNil(args, src => {
        iterate.forOwn(src, (val, key) => {
            if (!base.hasOwn(res, key)) {
                res[key] = val;
            } else {
                if (types.isObject(res[key]) && types.isObject(val)) {
                    res[key] = merge(res[key], val);
                } else {
                    if (types.notNil(val) && (!def || types.isNil(res[key]))) {
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
function freeze (obj, recurse=1, refs) {
    if (recurse) {
        refs = refs || new WeakSet();
        iterate.forOwn(obj, val => {
            if (typeof val === 'object' && val !== null && !refs.has(val)) {
                refs.add(val);
                freeze(val, recurse, refs);
            }
        });
    }
    return Object.freeze(obj);
}

function getOwn (obj, key) {
    if (types.notNil(obj) && base.hasOwn(obj, key)) {
        return obj[key];
    }
}

function setOwn (obj, key, val) {
    if (types.notNil(obj)) {
        return obj[key] = val;
    }
}

function has (obj, path) {
    if (types.notNil(obj)) {
        return iterate.everyNotNil(types.toPath(path), key => {
            if (base.hasOwn(obj, key)) {
                obj = obj[key];
            } else {
                return false;
            }
        });
    }
    return false;
}

function get (obj, path, def) {
    if (types.notNil(obj)) {
        let found = iterate.everyNotNil(types.toPath(path), key => {
            if (!base.hasOwn(obj, key)) {
                return false;
            } else {
                obj = obj[key];
            }
        });
        if (!found || types.isNil(obj)) {
            return def;
        }
        return obj;
    }
}

function set (obj, path, val) {
    let cur = obj;
    if (types.isObject(obj) || types.isArray(obj)) {
        iterate.each(types.toPath(path), (key, index, arr) => {
            if (index === arr.length - 1) {
                cur[key] = val;
            } else {
                if (base.hasOwn(cur, key)) {
                    if (types.isObject(cur[key])) {
                        cur = cur[key];
                    } else {
                        if (types.isNumeric(arr[index + 1])) {
                            cur = cur[key] = types.isArray(cur[key]) ? cur[key] : [];
                        } else {
                            cur = cur[key] = {};
                        }
                    }
                } else {
                    cur = cur[key] = types.isNumeric(arr[index + 1]) ? [] : {};
                }
            }
        });
    }
    return obj;
}

function keys (obj) {
    if (types.notNil(obj)) {
        return Object.keys(obj);
    }
    return [];
}

function join (obj, sep=',') {
    if (types.notNil(obj)) {
        return Array.prototype.join.call(obj, types.toString(sep));
    }
    return '';
}

// Split string on char
// Note: Supports regex, adds global flag if it doesn't exist
// Note: Quote handling only works for RegExps
// If you enable quotes and pass a String for char it will be converted to RegExp
// limit: Number matches to split on
// trim: Trim whitespace from result strings
// quotes: Ignore match if quoted
// quote: Character to match as quote (", ', or auto detect)
// extract: Remove quotes from result strings
// compact: Remove empty strings from result
function split (str, char, { limit=Infinity, trim, inclusive=0, quotes=0, quote, extract, compact=1 }={}) {
    str = types.toString(str);
    let index = 0;
    let m;
    let match;
    let sub = '';
    let res = [];
    let quoted = 0;
    let empty = !char || !!char.test?.('');
    let push = () => {
        if (trim) {
            sub = sub.trim();
        }
        if (extract && quote) {
            if (sub.at(0) === quote && sub.at(-1) === quote) {
                sub = sub.slice(1, -1);
            }
        }
        if (sub || !compact) {
            res.push(sub);
        }
    };
    if (quotes && types.isString(char)) {
        char = new RegExp(char);
    }
    if (types.isRegExp(char)) {
        let { source, flags } = char;
        if (quotes) {
            source = `["']|` + source;
        }
        if (!flags.includes('g')) {
            flags += 'g';
        }
        char = new RegExp(source, flags);
        while ((match = char.exec(str)) !== null && ([m] = match)) {
            if (quotes && m === '"' || m === "'") {
                if (!quote) {
                    quote = m;
                }
                if (m !== quote) {
                    continue;
                }
                quoted = !quoted;
                // Always need to continue from quotes
                continue;
            }
            if (quotes && quoted) {
                // Zero length
                if (!m) {
                    char.lastIndex++;
                }
                continue;
            }
            if (!limit) {
                break;
            }
            // Regular
            if (m) {
                sub = str.slice(index, match.index);
                push();
                index = char.lastIndex;
            // Zero length
            } else {
                if (empty) {
                    match.index++;
                }
                if (index !== match.index) {
                    sub = str.slice(index, match.index);
                    push();
                    index = match.index;
                }
                // If match is zero length, lastIndex wont't increment normally
                char.lastIndex++;
            }
            limit--;
        }
    } else {
        while ((match = str.indexOf(char, index)) > -1) {
            if (!limit) {
                break;
            }
            if (empty) {
                if (match >= str.length){
                    break;
                }                match++;
            }
            sub = str.slice(index, match);
            push();
            index = match + char.length;
            limit--;
        }
    }
    if (index < str.length) {
        sub = str.slice(index);
        push();
    }
    return res;
}

function toPairs (obj) {
    return iterate.map(obj, (val, key) => {
        return [key, val];
    }, 0);
}

function fromPairs (arr) {
    let res = {};
    iterate.each(arr, pair => {
        res[pair[0]] = pair[1];
    });
    return res;
}

// Uppercase
function toUpper (str) {
    return types.toString(str).toUpperCase();
}

// Lowercase
function toLower (str) {
    return types.toString(str).toLowerCase();
}

function toCase (str, head=str=>str, tail=str=>str) {
    str = types.toString(str);
    let char = str.codePointAt(0) ?? -1;
    if (char === -1) {
        return str;
    }
    let i = char > 0xFFFF ? 2 : 1;
    return head(String.fromCodePoint(char)) + tail(str.slice(i));
}

function capitalize (str) {
    return toCase(str, toUpper, toLower);
}

function toUpperFirst (str) {
    return toCase(str, toUpper);
}

function toLowerFirst (str) {
    return toCase(str, toLower);
}

// https://tc39.es/ecma262/multipage/text-processing.html#table-binary-unicode-properties
function deburr (str) {
    return types.toString(str).normalize('NFD').replace(constants.REGEX.diacritics, '');
}

// https://unicode.org/reports/tr44/#GC_Values_Table
function words (str) {
    return split(str, constants.REGEX.words);
}

function compound (str, fn=val=>val, sep='') {
    return join(iterate.map(words(str), fn), sep);
}

// Uppercase, space separated
function toUpperCase (str) {
    return compound(str, toUpper, ' ');
}

// Lowercase, space separated
function toLowerCase (str) {
    return compound(str, toLower, ' ');
}

function toCamelCase (str) {
    return compound(str, (val, i) => {
        return i ? capitalize(val) : toLower(val);
    });
}

function toKebabCase (str) {
    return compound(str, toLower, '-');
}

function toSnakeCase (str) {
    return compound(str, toLower, '_');
}

function toPascalCase (str) {
    return compound(str, capitalize);
}

function toStartCase (str) {
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

function escapeHTML (str) {
    str = types.toString(str);
    return str.replace(constants.REGEX.html, (match, char) => {
        return htmlEscapes[char];
    });
}

function unescapeHTML (str) {
    str = types.toString(str);
    return str.replace(constants.REGEX.htmlEscaped, (match, char) => {
        return htmlEscapes[char];
    });
}

function pad (str, len=0, char) {
    str = types.toString(str);
    if (len <= str.length) {
        return str;
    }
    let dif = len - str.length;
    return str.padStart(str.length + Math.floor(dif / 2), char).padEnd(len, char);
}

function padLeft (str, len=0, char) {
    return types.toString(str).padStart(len, char);
}

function padRight (str, len=0, char) {
    return types.toString(str).padEnd(len, char);
}

function trim (str) {
    return types.toString(str).trim();
}

function trimLeft (str) {
    return types.toString(str).trimStart();
}

function trimRight (str) {
    return types.toString(str).trimEnd();
}

// Run an iterator fn for each line in str
function eachLine (str, fn=constants.noop, inclusive=0) {
    str = types.toString(str);
    let match;
    let regex = new RegExp(constants.REGEX.eol.source, 'g');
    let i = 0;
    let n = 0;
    while ((match = regex.exec(str)) !== null) {
        fn(str.slice(i, inclusive ? regex.lastIndex : match.index), n, match[0]);
        n++;
        i = regex.lastIndex;
    }
    // Handle remaining string from last match
    fn(str.slice(i), n, '');
}

// Run an iterator fn for each line in str
// Return an array of return values
function mapLine (str, fn=constants.noop, inclusive=0) {
    let res = [];
    eachLine(str, (line, num, eol) => {
        res.push(fn(line, num, eol));
    }, inclusive);
    return res;
}

// Because line lengths are variable, len param acts like an offset
// count of chars to add per line, instead of an absolute length
function padLineFn (fn) {
    return function padLine (str, len=0, { char, head=0, inclusive=0 }={}) {
        return join(mapLine(str, (line, num, eol) => {
            return (num || head ? fn(line, line.length + len, char) : line) + (inclusive ? '' : eol);
        }, inclusive), null);
    }
}

const padLine = padLineFn(pad);
const padLineLeft = padLineFn(padLeft);
const padLineRight = padLineFn(padRight);

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

function format (str, ...args) {
    str = types.toString(str);
    return str.replace(constants.REGEX.fmt, (match, char) => {
        // Handle escape
        if (char === '%') {
            return char;
        }
        // If no corresponding argument don't replace
        if (!args.length) {
            return match;
        }
        let val = args.shift();
        let type = types.getType(val);
        switch (char) {
            case 's':
                return types.toString(val);
            case 'd':
            case 'i':
            case 'f':
                if (type === constants.TYPES.BigInt) {
                    return types.toString(val);
                }
                if (type === constants.TYPES.Symbol) {
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
                return types.toString(val);
            // Not implemented yet
            // Note: Full object not including non-enumerable properties and proxies
            case 'O':
                return types.toString(val);
            case 'c':
                return '';
            default:
                return match;
        }
    });
}

exports.hasOwn = base.hasOwn;
exports.assign = assign;
exports.capitalize = capitalize;
exports.compact = compact;
exports.concat = concat;
exports.deburr = deburr;
exports.defaults = defaults;
exports.eachLine = eachLine;
exports.escapeHTML = escapeHTML;
exports.flat = flat;
exports.flatCompact = flatCompact;
exports.fmt = format;
exports.format = format;
exports.freeze = freeze;
exports.fromPairs = fromPairs;
exports.get = get;
exports.getOwn = getOwn;
exports.has = has;
exports.join = join;
exports.keys = keys;
exports.mapLine = mapLine;
exports.merge = merge;
exports.pad = pad;
exports.padLeft = padLeft;
exports.padLine = padLine;
exports.padLineLeft = padLineLeft;
exports.padLineRight = padLineRight;
exports.padRight = padRight;
exports.set = set;
exports.setOwn = setOwn;
exports.split = split;
exports.toCamelCase = toCamelCase;
exports.toKebabCase = toKebabCase;
exports.toLower = toLower;
exports.toLowerCase = toLowerCase;
exports.toLowerFirst = toLowerFirst;
exports.toPairs = toPairs;
exports.toPascalCase = toPascalCase;
exports.toSnakeCase = toSnakeCase;
exports.toStartCase = toStartCase;
exports.toUpper = toUpper;
exports.toUpperCase = toUpperCase;
exports.toUpperFirst = toUpperFirst;
exports.trim = trim;
exports.trimLeft = trimLeft;
exports.trimRight = trimRight;
exports.unescapeHTML = unescapeHTML;
exports.words = words;
