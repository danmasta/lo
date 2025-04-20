import pluginAlias from '@rollup/plugin-alias';
import pluginNodeResolve from '@rollup/plugin-node-resolve';
import { resolve } from 'node:path';

let root = import.meta.dirname;

export default [
    {
        input: [
            'browser.js',
            'index.js'
        ],
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            sourcemap: false,
            strict: false,
            preserveModules: true,
            exports: 'named',
            entryFileNames: '[name].[format]',
            esModule: false
        },
        plugins: [
            pluginNodeResolve()
        ]
    },
    {
        input: [
            'qjs.js',
            'polyfill/qjs/buffer.js',
            'polyfill/qjs/console.js',
            'polyfill/qjs/events.js',
            'polyfill/qjs/fs.js',
            'polyfill/qjs/module.js',
            'polyfill/qjs/os.js',
            'polyfill/qjs/path.js',
            'polyfill/qjs/process.js',
            'polyfill/qjs/stream.js',
            'polyfill/qjs/util.js'
        ],
        output: {
            dir: 'dist/qjs',
            format: 'esm',
            sourcemap: false,
            strict: false,
            preserveModules: true,
            exports: 'named',
            entryFileNames: '[name].js',
            esModule: false
        },
        external: [
            'qjs:os',
            'qjs:std'
        ],
        plugins: [
            pluginAlias({
                entries: [
                    { find: /^node:(.+)$/, replacement: resolve(root, 'polyfill/qjs/$1.js') }
                ]
            }),
            pluginNodeResolve({
                exportConditions: ['qjs', 'default', 'import']
            })
        ]
    }
];
