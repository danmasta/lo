---
sidebar_position: 2
---
# About

Lo is a lightweight, modern utility library for **node**, **browser**, and **quickjs**. It has zero dependencies, ships as native ESM, and is tree-shakeable by default.

What sets it apart from most utility libraries is its foundation. Instead of guessing about types and capabilities via [duck-typing](https://en.wikipedia.org/wiki/Duck_typing), it is built on a small, fast [nominal type system](https://en.wikipedia.org/wiki/Nominal_type_system) that every other feature draws from.

## Philosophy

### Nominal type system

Most utility libraries answer "what is this object?" by probing the object's shape. Does it have a `.length`, a `.then`, a `Symbol.iterator`? That is called duck-typing. It works, but it's not inherently correct: a plain object with a `then` method looks like a promise, an object with a numeric `length` looks like an array, and cross-realm values slip through `instanceof`.

Lo takes the opposite approach. Types are identified **nominally** (by the identity of their prototype and constructor) and resolved against a table of known types. This makes type checks both fast (a map lookup) and accurate (a `Set` is a `Set`, never something that merely resembles one).

### Capabilities without guessing

Nominal identity alone can't answer "can I iterate this object?" or "does this value support `for await...of`?" Those questions are genuinely about structure. Rather than fall back to duck-typing, `lo` records those structural facts **once**, as flags on each type descriptor, derived from the prototype at registration time. You get the accuracy of nominal typing and the flexibility of structural queries, without paying the cost or the ambiguity of probing values at call time.

### Lightweight and deterministic

This library favors small, useful primitives with predictable behavior over magic

- **Zero dependencies**, native ESM, tree-shakeable
- **No side-effecty detection** - Type capabilities are declared or derived from prototypes, never discovered by invoking constructors or calling functions to "see what happens"
- **Lean defaults, with opt-in depth** - The default core type set covers the common built-ins. Larger and/or environment-specific type sets are separate groups you can register as needed

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

Every descriptor is a singleton: `getType(a) === getType(b)` whenever `a` and `b` are the same type, so downstream code can compare descriptors by identity and read capability flags directly.

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
| `known` | `boolean` | Exists in this runtime |

### Safe by design

`getType` always returns a descriptor and never `undefined`. Unknown values resolve to `TYPES.Unknown` at worst. And because the result is always a descriptor, accessors like `getType(x).each` are safe without a guard, which keeps the rest of the library terse and branch-light.

### Caching and lookup

Type information is computed once and cached in three maps internally

- Ref by `typeof` (fast primitive path)
- Ref by constructor (values and `getCtorType`)
- Ref by prototype (prototype-chain resolution)

A `getType` call takes a fast path through `typeof` and constructor identity for common built-ins, and only walks the prototype chain when it must. Resolved types are memoized, so repeated checks are effectively free.

### Terse tables and derived flags

Types are declared as compact records and expanded into full descriptors at load. Only the facts that *can't* be inferred are defined statically (the four-slot `x` tuple `[construct, call, create, collection]`), while the structural flags (`each`, `iterable`, `async`, `entries`) are **derived from the prototype** automatically

```js
// A registered type record
{
    n: 'Set',
    x: [1, 0, 2, 1] // construct, not callable, create via new, is a collection
}
```

This keeps the tables readable and hard to get subtly wrong: capabilities that live on the prototype are never duplicated as manual metadata, so they can't drift.

## Type groups and extensibility

### Tree-shakeable groups

The type descriptor tables are split into logical, independently registerable groups: `core`, `errors`, `collections`, `binary`, `iterators`, `functions`, `web`, plus environment-specific sets (node streams/buffers, optional server/IO handles, DOM nodes, and browser APIs).

Only `core` is seeded by default, and each entry point composes the groups needed for its target. Because the registration calls are the library's only import-time side effects, they are declared explicitly in `package.json` `sideEffects`, so bundlers can tree-shake everything a consumer doesn't use while never dropping the type registrations that are required.

### Graceful degradation

By default, encountering an unregistered subclass doesn't fail or silently bloat the type table. Instead it resolves to the **nearest registered ancestor**, inheriting correct capability flags derived from the prototype. A custom stream subclass resolves to `Readable`, and a DOM node subtype resolves to `Node`.

The `settings.addUnknownTypes` flag (off by default) can opt into caching unknown types by their own identity instead, trading a small, bounded, predictable footprint for more specific naming.

### Extending the type registry

Consumers can register their own type descriptors with the same mechanism the library uses internally

```js
import { addTypes } from 'lo';
import { io } from 'lo/types/io';

addTypes(io); // adds server/IO handle types
```

The optional groups are regular importable modules, so applications can pull in only the types (and underlying platform imports) they actually want.

## Multi-target by design

Lo ships distinct entry points for **node**, **browser**, and **quickjs**, selectable through conditional `exports`. Each entry point registers the type groups and platform bindings that make sense for its environment, and shared logic stays identical across all three.

For embedded targets like quickjs, node built-ins can be supplied through lightweight polyfills, so the same nominal type system and iteration utilities work even in runtimes without `node:` modules.

The result is a single, coherent library. Fast and accurate at its core, small at the edges, and consistent everywhere it runs.
