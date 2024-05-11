import resolve from '@rollup/plugin-node-resolve';
import { glob } from 'glob';

export default [
    {
        input: glob.sync([
            'browser.js',
            'index.js',
            'lib/**/*.js',
            'types/**/*.js'
        ]),
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
            resolve()
        ]
    }
];
