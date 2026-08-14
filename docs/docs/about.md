---
sidebar_position: 2
---
# About

Lo is a lightweight, modern utility library for **node**, **browser**, and **quickjs**. It has zero dependencies, ships as native ESM, and is tree-shakeable by default.

What sets it apart from most utility libraries is its foundation. Instead of guessing about types and capabilities via [duck-typing](https://en.wikipedia.org/wiki/Duck_typing), it is built on a small, fast [nominal type system](https://en.wikipedia.org/wiki/Nominal_type_system) that every other feature draws from.

## Philosophy

### Nominal type system

Most utility libraries answer "what is this object?" by probing the object's shape. Does it have a `.length`, a `.then`, a `Symbol.iterator`? That is called duck-typing. It works, but it's not inherently correct: a plain object with a `then` method looks like a promise, an object with a numeric `length` looks like an array, and cross-realm values slip through `instanceof`.

Lo takes the opposite approach. Types are identified **nominally** (by the identity of their prototype and constructor) and resolved against a table of known types. This makes type checks both fast (a map lookup) and accurate (only a real `Set` can return the `Set` descriptor, never something that merely resembles one).

### Structural capabilities

Nominal identity alone can't answer questions like "can I iterate this object?", or "does this value support `for await...of`?". Those questions are genuinely about structure. Rather than fall back to duck-typing, Lo records those structural facts **once**, as flags on each type descriptor, derived from the prototype at registration time. You get the accuracy of nominal typing and the flexibility of structural queries, without paying the cost or the ambiguity of probing values at call time.

### Functional and predictable

Lo favors small, composable functions with predictable behavior. The same input always resolves to the same type and takes the same code path, because dispatch is driven by nominal identity.

- **Pure, composable primitives** - Utilities are small functions that compose cleanly, whether you're checking types, iterating collections, transforming strings, or parsing argv
- **Deterministic dispatch** - Type resolution is a pure lookup on a value's identity, so a given value always resolves to the same descriptor and the same branch, on every run
- **No side-effecty detection** - Type capabilities are derived from prototypes, not discovered by invoking constructors or calling functions to "see what happens"
- **Lean defaults and opt-in depth** - The default core type descriptor set covers the common built-ins. Larger and runtime-specific type sets are separate groups you can register as needed

## Type system

### Type descriptors

The heart of the library is `getType`, which returns a rich, cached **type descriptor**, not a string label

```js
import { getType } from 'lo';

const t = getType(new Set());
t.name       // 'Set'
t.collection // true  (a first-class iterable collection)
t.each       // true  (has forEach)
t.entries    // true  (has entries())
t.async      // false (no @@asyncIterator)
t.create     // 2     (created via new)
```

Every descriptor is a singleton: `getType(x) === getType(y)` whenever `x` and `y` are the same type, so downstream code can compare descriptors by identity and read capability flags directly.

Each descriptor includes both **identity** and **capability**

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

### Safe by design

`getType` always returns a descriptor and never `undefined`, and unknown values resolve to `TYPES.Unknown` at worst. Because the result is always a descriptor, accessors like `getType(x).each` are safe without a guard, which keeps the rest of the library terse and branch-light.

### Caching and lookup

Type information is computed once and cached in three maps internally

- Ref by `typeof` (fast primitive path)
- Ref by constructor (values and `getCtorType`)
- Ref by prototype (prototype-chain resolution)

A `getType` call takes a fast path through `typeof` and constructor identity for common built-ins, and only walks the prototype chain when needed. Resolved types are memoized, so repeated checks are effectively free.

### Compact records

Types are declared as compact records and expanded into full descriptors at load time. Only the facts that *can't* be inferred are defined statically (the four-slot `x` tuple `[construct, call, create, collection]`), while structural flags (`each`, `iterable`, `async`, `entries`) are **derived from the prototype** automatically

```js
// Compact type descriptor definition
{
    n: 'Set',
    x: [1, 0, 2, 1] // construct, not callable, create via new, is a collection
}
```

This keeps the tables readable and hard to get subtly wrong: capabilities that live on the prototype are never duplicated as manual metadata, so they can't drift.

## Type groups and extensibility

### Tree-shakeable groups

The type descriptor tables are split into logical, independently registerable groups: `core`, `errors`, `collections`, `binary`, `iterators`, `functions`, `web`, plus environment-specific sets (node streams/buffers, optional server/IO handles, DOM nodes, and browser APIs).

Only `core` is seeded by default, and each entry point composes the groups needed for its target. Because the registration calls are the library's only import-time side effects, they are declared explicitly in `package.json` `sideEffects`, so bundlers can tree-shake everything a consumer doesn't use without dropping the type registrations that are needed.

### Graceful degradation

By default, encountering an unregistered subclass doesn't fail (or silently add to the type table). Instead it resolves to the **nearest registered ancestor**, inheriting correct capability flags derived from the prototype. A custom readable stream subclass resolves to `Readable`, and a DOM node subtype resolves to `Node`.

The `settings.addUnknownTypes` flag (`false` by default) can opt in to caching unknown types by their own identity instead, trading a small, bounded, predictable footprint for more specific naming.

### Extending the type registry

Consumers can register their own type descriptors with the same mechanism the library uses internally

```js
import { addTypes } from 'lo';
import { io } from 'lo/types/io';

addTypes(io); // add server/IO handle types
```

The optional groups are regular importable modules, so applications can pull in only the types (and underlying platform imports) they actually want.

## Unified iteration

Because every type descriptor already defines whether a value is a collection, has `forEach`, is iterable, or async-iterable, Lo can offer a single iteration interface that spans *every* type instead of just a couple type-specific loops.

The same functions (`each`, `map`, `filter`, `reduce`, `find`, `some`, `every`, `flatMap`, and more), operate on arrays, plain objects, `Map`, `Set`, typed arrays, generators, and even single non-collection values, dispatching on the nominal type rather than probing the value. Early termination is uniform as well: return the `BREAK` symbol from any callback to cancel iteration.

Most importantly, the same iteration functions support **sync and async** transparently. Lo inspects both the input and the callback, and if the value is an async iterable or the callback is an async function, iteration switches to an awaited path and returns a promise; otherwise it stays fully synchronous. You call `map(x, fn)` once, and it does the right thing whether `x` is an array or an async generator, and whether `fn` is sync or `async`.

Every iteration function supports a `notNil` option (`map(x, fn, { notNil: true })`), which skips `null` and `undefined` entries and return values. A common need that otherwise clutters code with checks for empty values.

## Application helpers

Beyond identity, capabilities, and iteration, Lo includes small, practical utilities that real programs need, but aren't part of the JavaScript standard library, or available in embedded runtimes like quickjs:

- **Environment variables** - `env` variable getter/setter that returns native types, with support for bulk assignment
- **Argv parsing** - `parseArgv` and `optsFromArgv`, with support for negation, camel-casing, native type casting, and sub-command groups
- **LRU cache** - Compact `LRU` implementation with both space (`max` entry bound) and time (`ttl`) expiry. Supports passive (expire on access) or active (timer-driven) modes. Includes hooks for `onDispose`/`refresh`, and a factory helper
- **String formatting** - printf-style `format`/`fmt` functions, case conversion (`toCamelCase`, `toKebabCase`, `toSnakeCase`, etc), padding, trimming, and line-aware formatting
- **Time and numbers** - Epoch and monotonic time helpers, and numeric rounding
- **IP addresses** - Conversion between string and buffer formats, validation, and family detection

Because these build on the same nominal core, they behave identically everywhere. A few helpers (such as `env` and `argv`) rely on platform APIs for their defaults, and for that Lo ships an optional set of lightweight `node:` polyfills. These aren't loaded by default, but you can point a bundler at them to supply those built-ins on runtimes that don't provide them.

## Multi-target

Lo ships distinct entry points for **node**, **browser**, and **quickjs**, selectable through conditional `exports`. Each entry point registers the type groups and platform bindings for its environment, and shared logic stays identical across all three.

Most of the library (the nominal type system, iteration, and the majority of utilities), has no dependency on `node:` built-ins and runs anywhere as-is. Only a handful of helpers need platform APIs, and for runtimes that lack them, the optional polyfills can be aliased at bundle time (they are not pulled in automatically).

The result is a single, coherent library. Fast and accurate at its core, small at the edges, and consistent everywhere it runs.
