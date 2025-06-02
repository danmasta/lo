import { Stream, Readable, Writable, Transform, Duplex, PassThrough } from '../polyfill/qjs/stream.js';
import { Buffer } from '../polyfill/qjs/buffer.js';
import '../polyfill/qjs/process.js';
import { env } from '../polyfill/qjs/core.js';

var supplemental = [
    {
        n: 'Buffer',
        c: Buffer,
        x: [1, 1, 2, 1]
    },
    {
        n: 'Stream',
        c: Stream,
        x: [1, 1, 2]
    },
    {
        n: 'Readable',
        c: Readable,
        x: [1, 1, 2]
    },
    {
        n: 'Writable',
        c: Writable,
        x: [1, 1, 2]
    },
    {
        n: 'Transform',
        c: Transform,
        x: [1, 1, 2]
    },
    {
        n: 'Duplex',
        c: Duplex,
        x: [1, 1, 2]
    },
    {
        n: 'PassThrough',
        c: PassThrough,
        x: [1, 1, 2]
    },
    {
        n: 'Env',
        c: env.constructor,
        x: [1, 1, 2]
    }
];

export { supplemental as default };
