import { toString } from './types.js';

// https://developer.mozilla.org/en-US/docs/Web/API/console/dir_static
// https://nodejs.org/api/util.html#utilinspectobject-options
// https://github.com/nodejs/node/blob/25842c5e35efb45df169e591c775a3c4f853556d/lib/internal/util/inspect.js#L780
// Get type name
// Get type props
//     symbols = getOwnPropertySymbols
//     if showHidden = true
//         props = getOwnPropertyNames + symbols
//     else
//         props = keys + enumerable symbols only (filter => propertyIsEnumerable)
// Get type formatter
// Get type braces
// Get type color
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
//     URL
// Handle circular references
function inspect (obj, { colors=false, depth=2, showHidden=false, showProxy=false }={}) {
    return toString(obj);
}

export { inspect };
