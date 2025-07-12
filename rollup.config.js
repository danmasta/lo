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
            'polyfill/base/buffer.js',
            'polyfill/base/console.js',
            'polyfill/qjs/core.js',
            'polyfill/base/events.js',
            'polyfill/qjs/fs.js',
            'polyfill/base/module.js',
            'polyfill/base/os.js',
            'polyfill/base/path.js',
            'polyfill/base/process.js',
            'polyfill/base/stream.js',
            'polyfill/base/util.js'
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
                    { find: /.+\/core\.js$/, replacement: resolve(root, 'polyfill/qjs/core.js') },
                    { find: 'node:fs', replacement: resolve(root, 'polyfill/qjs/fs.js') },
                    { find: /^node:(.+)$/, replacement: resolve(root, 'polyfill/base/$1.js') }
                ],
            }),
            pluginNodeResolve({
                exportConditions: ['qjs', 'import']
            })
        ]
    }
];
