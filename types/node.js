import { Stream, Readable, Writable, Transform, Duplex, PassThrough } from 'stream';

export default [
    {
        n: 'Buffer',
        x: [1, 1, 2]
    },
    {
        n: 'SharedArrayBuffer',
        x: [1, 0, 2]
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
    }
];
