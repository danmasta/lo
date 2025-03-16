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
            'qjs.js'
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
        plugins: [
            pluginAlias({
                entries: [
                    { find: /^node:(.+)$/, replacement: resolve(root, './polyfill/qjs/$1.js') }
                ]
            }),
            pluginNodeResolve({
                exportConditions: ['qjs', 'default', 'import']
            })
        ]
    }
];
