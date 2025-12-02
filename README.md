# Lo
Lightweight, modern utility library for node, browser, and quickjs

#### Features:
* Easy to use
* Lightweight (~7.5kb minified, ~2.5kb gzip)
* Node and browser support
* Native esm and cjs support
* Treeshakeable by default
* Support for all iterable types
* Support for [async](#async-iteration) iterables and async iterator functions
* Support for [quickjs](#quickjs)
* 0 dependencies

## About
I wanted a lighter weight, modern utility library. I had written a bunch of methods over the years that I use between projects as needed, so I decided to normalize them, add a type system, and consolidate them into this package. I also wanted to be able to add different methods for environments like node or browser, not have to use polyfills, and support [async iteration](#async-iteration).

## Usage
Add lo as a dependency and install via npm
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
This package exports a browser version which excludes functions that depend on node specific apis and includes some browser specific types. If you use a bundler it should automatically be able to resolve the browser entry point. If you want to explicity import it you can do that too:
```js
import lo from 'lo/browser';
```

### Collections
This package is different from other utility libraries in that it defines *collection types* for iteration. By default, if it is not a collection type, it is iterated as a whole object.

#### Collection Types
The current collection types are defined as:
* `Array`
* `Map`
* `Set`
* `TypedArray`
* `Array Iterator`
* `String Iterator`
* `Map Iterator`
* `Set Iterator`
* `Generator`
* `AsyncGenerator`
* `Iterator`
* `AsyncIterator`
* `Buffer`
* `NodeList`

What is not a collection type:
* `Boolean`
* `Number`
* `BigInt`
* `String`
* `Symbol`
* `Function`
* `Object`
* `ArrayBuffer`
* `DataView`
* `Stream`
* ...other `Object` types such as `RegExp`, `Date`, `Promise`, `Error`, etc

### Iteration
When using iterator functions like `each`, `map`, `tap`, `some`, `every`, `filter`, `remove`, and `iterate` the default mode is to iterate *as a collection*. This means they will iterate on whole objects only, and not on the properties of a single object. For iterating the properties of a single object you can use the functions `forIn` and `forOwn`.

This means if you pass a single object instead of a [collection type](#collection-types) it will treat the object as a one-object collection and iterate one time:
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
*Note: All iterator functions work for any iterable type including `Array`, `Map`, `Set`, `Iterator`, and `Generator`.*

#### Iterate Objects
Methods to iterate the properties of individual objects and iterables: `forIn`, and `forOwn`.

#### Iterate Collections
Methods for iterating collections of objects: `each`, `map`, `tap`, `some`, `every`, `filter`, `remove`, and `iterate`.

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
A common task during iteration is checking for `nil` (`null` or `undefined`) values. This package has support for filtering `nil` values for various iteration methods. It will ignore `nil` values before the iterator function is called. It will also filter return values for functions that return, such as `map`, `some`, and, `every`. To use, just append `NotNil` to the function name:
```js
import { mapNotNil as map } from 'lo';

let arr = [1, undefined, 2, 3, null];

map(arr, val => {
    return val % 3 === 0 ? undefined : val;
});

// [1, 2]
```
*Methods that support `nil` filtering include: `each`, `map`, `tap`, `some`, `every`, `filter`, `remove`*

#### Async Iteration
Every iteration method also supports both async iterables and async iterator functions. You don't need to do anything special, just use them as normal:
```js
import { map } from 'lo';

async function* list () {
    yield 1;
    yield 2;
    yield 3;
}

await map(list(), async val => {
    return await val * 2;
});

// [2, 4, 6]
```

### QuickJS
[QuickJS](https://github.com/quickjs-ng/quickjs) is a small, embeddable javascript engine written in C that supports the latest ECMAScript specification including modules, async await, iterators, generators, proxies, etc. It can also be used to compile and package javascript code into standalone executables. This library works great with quickjs and includes some node api [polyfills](polyfill/qjs) to help compile tooling and clis written with node into standalone binaries.

While this project doesn't intend to provide complete polyfills for the entire node api, it does include some of the more common ones:
* `console`
* `events`
* `fs`
* `module`
* `os`
* `path`
* `process`

To use them in your own project, you can point your bundler at the `polyfill/qjs` directory for any of the supported node polyfills. If you want to explicity import the qjs entry point, you can do that too:
```js
import lo from 'lo/qjs';
```

*You can find an example project that exposes a node api, cli, and standalone binary built using this package [here](https://github.com/danmasta/envstr).*

## Documentation
A list of methods and some documentation can be found [here](https://danmasta.github.io/lo/)

## Testing
Tests are currently run using mocha and chai. To execute tests run `make test`. To generate unit test coverage reports run `make coverage`

## Contact
If you have any questions feel free to get in touch
