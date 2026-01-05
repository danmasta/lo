# Lo
Lightweight, modern utility library for node, browser, and quickjs

#### Features:
* Simple and lightweight
* Supports node, browser, and [quickjs](#quickjs)
* Native ESM
* Treeshakeable by default
* Support for all iterable types
* Support for [async](#async-iteration) iterables and async iterator functions
* Nominal type system
* 0 dependencies

## About
A lightweight, modern utility library. This package is different from other utility libraries in that it avoids [duck-typing](https://en.wikipedia.org/wiki/Duck_typing) and implements a simple [nominal type system](https://en.wikipedia.org/wiki/Nominal_type_system) at it's core. This allows for very fast and accurate type checking. Information about types is also cached at start up and used to provide advanced functionalities like iteration support for every iterable type, including async iterables, generators, and async iterator functions.

You can read more about the design philosophy in the [docs](https://danmasta.github.io/lo/).

## Usage
Add `lo` as a dependency and install via npm
```bash
npm install lo@danmasta/lo --save
```
Install a specific [version](https://github.com/danmasta/lo/tags)
```bash
npm install lo@danmasta/lo#semver:^v0.0.0 --save
```
*See documentation regarding git dependencies [here](https://danmasta.github.io/lo/installation)*

Import functions
```js
import lo, { each, map } from 'lo';
```

### Browser
This library also exports a browser entrypoint, which excludes functions that depend on node specific APIs, and includes some browser specific types. If you use a bundler it should be able to automatically resolve the browser entrypoint. If you want to explicity import it, you can do that too:
```js
import lo from 'lo/browser';
```

### Collections
This package defines specific [*collection types*](#collection-types) for iteration. By default, if it is not a collection type, it is iterated as a one-object collection.

#### Collection Types
The current collection types are defined as:
* `Array`
* `Map`
* `Set`
* `Array Iterator`
* `Map Iterator`
* `Set Iterator`
* `String Iterator`
* `Generator`
* `AsyncGenerator`
* `Iterator`
* `AsyncIterator`
* `TypedArray`
* `Buffer`
* `NodeList`
* `Headers`
* `FormData`
* `URLSearchParams`

### Iteration
When using iterator functions like: `each`, `map`, `tap`, `some`, `every`, `filter`, `remove`, `reduce`, `transform`, etc, the default mode is to iterate ***as a collection***. This means they will iterate on collections only, and not on the properties of a single object. For iterating the properties of a single object, you can use the functions `forIn` and `forOwn`.

This means if you pass a single object instead of a [*collection type*](#collection-types), it will treat the object as a one-object collection and iterate one time:
```js
import { each } from 'lo';

let obj = { a: true, b: false };

each(obj, (val, key) => {
    console.log(key, val);
});

// 0 { a: true, b: false }
```
Each iterator function has the following signature:
```js
method(iterable, iteratorFn, collection?)
```
Where `collection` is `true` by default. If you want to use an iterator method to iterate the properties of a single object you can set the `collection` argument to `false`:
```js
import { each } from 'lo';

let obj = { a: true, b: false };

each(obj, (val, key) => {
    console.log(key, val);
}, false);

// a true
// b false
```
*All iterator methods support every iterable type including: `Array`, `Map`, `Set`, `Iterator`, `Generator`, etc.*

#### Iterate Objects
Methods to iterate the properties of individual objects and iterables: `forIn`, and `forOwn`.

#### Iterate Collections
Methods for iterating collections: `each`, `map`, `tap`, `some`, `every`, `filter`, `remove`, `drop`, `take`, `reduce`, `transform`, `find`, `flatMap`, and `iterate`.

#### forEach
Using the `forEach` method works slightly different from other iterator methods. It defers to the object's own `forEach` method if it exists. This means it works for things like `Array`, `Map`, `Set`, `Iterator`, and `Buffer`, but will also work for `Streams`.

#### Break Iteration Early
All iteration methods can be stopped early by returning the `BREAK` symbol:
```js
import { map, BREAK } from 'lo';

let arr = [1, 2, 3, 4];

map(arr, val => {
    return val % 3 === 0 ? BREAK : val * 2;
});

// [2, 4]
```

#### Nil Filtering
A common task during iteration is checking for `nil` (`null` or `undefined`) values. This package has support for filtering `nil` values for various iteration methods. It will ignore `nil` values before the iterator function is called. It will also filter return values for functions that return, such as `map`, `some`, `every`, etc. To use, just append `NotNil` to the function name:
```js
import { mapNotNil as map } from 'lo';

let arr = [1, undefined, 2, 3, null];

map(arr, val => {
    return val % 3 === 0 ? undefined : val;
});

// [1, 2]
```
*All iterator methods support `nil` filtering*

#### Async Iteration
Every iteration method also supports both async iterables and async iterator functions. You don't need to do anything special, just use them like normal:
```js
import { map } from 'lo';

async function* list () {
    yield 1;
    yield 2;
    yield 3;
}

await map(list(), async val => {
    return val * 2;
});

// [2, 4, 6]
```

### QuickJS
[QuickJS](https://github.com/quickjs-ng/quickjs) is a small, embeddable javascript engine written in C that supports the latest ECMAScript specification including modules, async/await, iterators, generators, proxies, etc. It can also be used to compile and package javascript code into standalone executables. This library works great with QuickJS and includes some node API [polyfills](polyfill) to help compile tooling and CLIs written with node into standalone binaries.

While this project doesn't intend to provide complete polyfills for the entire node API, it does include some of the more common ones:
* `console`
* `events`
* `fs`
* `module`
* `os`
* `path`
* `process`

To use them in your own project, you can point your bundler at the `lo` polyfills directory for node imports. You can see an example in the [docs](https://danmasta.github.io/lo/polyfills#quickjs).

## Documentation
A list of methods and some documentation can be found [here](https://danmasta.github.io/lo/)

## Testing
Tests are currently run using mocha and chai. To execute tests run `make test`. To generate unit test coverage reports run `make coverage`

## Contact
If you have any questions feel free to get in touch
