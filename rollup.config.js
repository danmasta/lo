import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';

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
            alias({
                entries:{
                    '#node:os': 'node:os',
                    '#node:process': 'node:process',
                    '#node:stream': 'node:stream',
                    '#node:buffer': 'node:buffer'
                }
            }),
            resolve()
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
            exports: 'auto',
            entryFileNames: '[name].js',
            esModule: false
        },
        plugins: [
            resolve({
                exportConditions: ['qjs', 'default', 'import']
            })
        ]
    }
];
