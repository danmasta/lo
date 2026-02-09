import { Buffer } from 'node:buffer';
import { ReadStream, WriteStream } from 'node:fs';
import { env } from 'node:process';
import { Duplex, PassThrough, Readable, Stream, Transform, Writable } from 'node:stream';

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
    },
    {
        n: 'Env',
        c: env.constructor,
        x: [1, 1, 2]
    },
    {
        n: 'ReadStream',
        c: ReadStream,
        x: [1, 1, 2]
    },
    {
        n: 'WriteStream',
        c: WriteStream,
        x: [1, 1, 2]
    }
];
