import { Stream, Readable, Writable, Transform, Duplex, PassThrough } from '#node:stream';
import { Buffer } from '#node:buffer';

export default [
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
    }
];
