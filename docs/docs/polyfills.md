---
sidebar_position: 5
---
# Polyfills

This project doesn't intend to provide polyfills for the entire node API, but it does include at least the base amount needed to run this package. Provided polyfills include:
* `buffer` (*placeholder*)
* `console`
* `events`
* `fs` (*quickjs*)
* `module`
* `os`
* `path`
* `process`
* `stream` (*placeholder*)
* `util`

## Usage
If you want to use the base polyfills as alternative implementations in environments that already support node APIs, you can import the module paths directly:
```js
import { resolve } from 'lo/polyfill/path';
```
*This is mostly useful for testing, but they are available if needed*

## QuickJS
Polyfills are also compatible with [`QuickJS`](https://github.com/quickjs-ng/quickjs). You will need to use a bundler and point your node imports to the `lo` polyfills directory. An example using `rollup` looks like:
```js
// rollup.config.js
import alias from '@rollup/plugin-alias';
import nodeResolve from '@rollup/plugin-node-resolve';
import { resolve } from 'node:path';

export default [
    {
        input: [
            'index.js'
        ],
        output: {
            dir: 'build',
            format: 'esm',
            sourcemap: false,
            strict: false,
            preserveModules: true,
            exports: 'named',
            entryFileNames: '[name].js',
            esModule: false,
            importAttributesKey: 'with'
        },
        external: [
            'qjs:os',
            'qjs:std'
        ],
        plugins: [
            alias({
                entries: [
                    {
                        find: '#polyfill/core',
                        replacement: '#polyfill/qjs/core'
                    },
                    {
                        find: /^node:(fs)$/,
                        replacement: resolve('node_modules/lo/polyfill/qjs/$1')
                    },
                    {
                        find: /^node:(buffer|console|events|module|os|path|process|stream|util)$/,
                        replacement: resolve('node_modules/lo/polyfill/base/$1')
                    }
                ]
            }),
            nodeResolve({
                exportConditions: ['import']
            })
        ]
    }
];
```
This will allow you to compile a bundle that runs in QuickJS with support for some node API imports. You can see an example of a project that exposes a node API, CLI, and standalone binary built using this package [here](https://github.com/danmasta/envstr).
