---
sidebar_position: 3
---
# Types

The type system is the foundation everything in Lo is built on. This page covers how to use it directly: getting a value's type, checking capabilities, converting between types, and extending the registry. For reasoning behind the design, check out the [about](./about.md) page.

## Getting the type of a value

`getType` returns a cached **type descriptor** for any value

```js
import { getType, TYPES } from 'lo';

getType([]);        // TYPES.Array
getType(new Set()); // TYPES.Set
getType(42);        // TYPES.Number
getType(null);      // TYPES.Null
getType(undefined); // TYPES.Undefined
```

Descriptors are singletons, so you can compare them by identity

```js
getType(value) === TYPES.Array;
```

`getType` is **safe**. It always returns a descriptor and never `undefined`, falling back to `TYPES.Unknown` for unrecognized values, so accessors never need a guard

```js
getType(anything).collection; // never throws
```

Passing a descriptor back into `getType` returns it unchanged, so the function is idempotent

```js
getType(TYPES.Set) === TYPES.Set;
```

If you just want the name as a string, you can use `getTypeStr` (which falls back to the value's `toStringTag` for unknown types)

```js
import { getTypeStr } from 'lo';

getTypeStr(new Set()); // 'Set'
getTypeStr(42);        // 'Number'
```

## Type descriptors

Each descriptor includes both a type's **identity** and its **capabilities**

| Field | Type | Description |
| --- | --- | --- |
| `type` | `string` | `typeof` category (`object`, `function`, `string`, ...) |
| `name` | `string` | Type name (`Set`, `Uint8Array`, `Null`, ...) |
| `ctor` | `function` | Constructor |
| `proto` | `object` | Prototype |
| `construct` | `boolean` | Whether it can be constructed |
| `call` | `boolean` | Whether it can be called |
| `create` | `number` | Creation strategy: `0`=none, `1`=call, `2`=construct |
| `collection` | `boolean` | Treated as a first-class iterable collection |
| `each` | `boolean` | Has `forEach` |
| `iterable` | `boolean` | Has `@@iterator` |
| `async` | `boolean` | Has `@@asyncIterator` |
| `entries` | `boolean` | Has `entries()` |
| `object` | `boolean` | Is a non-null object type |
| `known` | `boolean` | Exists in the current runtime |

*The `each`, `iterable`, `async`, and `entries` flags are derived from the prototype automatically, so they always match reality*

## Checking types

Predicate helpers wrap `getType` for common checks and read naturally

```js
import { isArray, isString, isPromise, isError } from 'lo';

isArray([]);              // true
isString('hi');           // true
isPromise(fetch('/'));    // true
isError(new TypeError()); // true
```

| Category | Predicates |
| --- | --- |
| Nil | `isNil`, `notNil`, `isNull`, `isUndefined` |
| Primitives | `isNumber`, `isNumeric`, `isString`, `isBoolean` |
| Objects | `isObject`, `isModule`, `isRegExp`, `isError` |
| Functions | `isFunction`, `isAsyncFunction`, `isGeneratorFunction` |
| Iteration | `isIterable`, `isAsyncIterable`, `isCollection`, `hasForEach`, `hasEntries` |
| Binary | `isTypedArray`, `isArrayBuffer` |
| Meta | `isCtor`, `isClass`, `isIterator`, `isPromise`, `isArray` |

## Iteration and collection types

Iteration helpers are how Lo supports every iterable shape (arrays, maps, sets, typed arrays, iterators, generators, and async iterables), through one consistent surface

```js
import { isCollection, isIterable, isAsyncIterable, hasForEach, hasEntries } from 'lo';

isCollection(new Set());       // true (a first-class collection)
isIterable('abc');             // true (has @@iterator)
isAsyncIterable(stream);       // true (supports for await...of)
hasForEach(new Uint8Array(4)); // true
hasEntries(new Map());         // true
```

A **collection type** is iterated element-by-element. Anything that is *not* a collection type is treated as a single-item collection, so operations behave predictably on scalars and plain objects alike. Collection types include `Array`, `Map`, `Set`, the `*Iterator` types, `Generator` / `AsyncGenerator`, `TypedArray`, `Buffer`, and platform collections like `NodeList` and `Headers`.

The distinction between `iterable` and `collection` is deliberate: a `String` is iterable but is **not** a collection, so it's treated as one value rather than a stream of characters unless you ask otherwise.

## Types from constructors

`getCtorType` resolves a **constructor** to the type of the values it produces (the inverse of `getType`)

```js
import { getCtorType, TYPES } from 'lo';

getCtorType(Promise); // TYPES.Promise
getCtorType(Boolean); // TYPES.Boolean
```

*`getCtorTypeStr` returns the name as a string*

### Casting and empty values

`toType` casts a value to a target type using that type's creation strategy

```js
import { toType } from 'lo';

toType(Set, [1, 2, 3]); // Set(3) { 1, 2, 3 }
toType(Boolean, 1);     // true
toType(Map, [[1, 2]]);  // Map(1) { 1 => 2 }
```

`of` returns an empty value of the same type (useful for accumulators)

```js
import { of } from 'lo';

of([1, 2, 3]);       // []
of(new Set([1, 2])); // Set(0) {}
of({ a: 1 });        // {}
of(10);              // 0
of('text');          // ''
```

## Converting values

```js
import { toArray, toObject, toString } from 'lo';

toArray(new Set([1, 2, 3]));   // [1, 2, 3]
toArray('123');                // ['1', '2', '3']
toArray(null);                 // []
toObject(new Map([['a', 1]])); // { a: 1 }
toString([1, 2, 3]);           // '1,2,3'
```

These conversions are driven by the same descriptors, so they work across every registered type (including iterables and iterator objects), rather than a hard-coded list.

## The type registry

All known types live in the `TYPES` constant (keyed by name)

```js
import { TYPES } from 'lo';

TYPES.Map.collection;  // true
TYPES.String.iterable; // true
```

The table is split into tree-shakeable logical groups. Each entry point registers groups relevant to its target. You can register additional types (including optional groups the library ships, but doesn't load by default) with `addTypes`

```js
import { addTypes } from 'lo';
import { io } from 'lo/types/io';

addTypes(io); // add server/IO handle types (http, net, dgram, child_process)
```

*`addType` registers a single type record the same way*

### Unknown types

By default, an unregistered subclass resolves to its nearest registered ancestor (with the correct derived capability flags). A custom readable stream subclass resolves to `Readable`, and a DOM node subtype resolves to `Node`. To cache unknown types in the registry using their own identity instead, you can enable the `addUnknownTypes` setting

```js
import { settings } from 'lo/constants';

settings.addUnknownTypes = true;
```

This trades a bounded, predictable type table for more specific naming of user-defined types. See the [about](./about.md#graceful-degradation) page for tradeoffs.
