var node_stream = require('node:stream');
var node_buffer = require('node:buffer');
var node_process = require('node:process');

var supplemental = [
    {
        n: 'Buffer',
        c: node_buffer.Buffer,
        x: [1, 1, 2, 1]
    },
    {
        n: 'Stream',
        c: node_stream.Stream,
        x: [1, 1, 2]
    },
    {
        n: 'Readable',
        c: node_stream.Readable,
        x: [1, 1, 2]
    },
    {
        n: 'Writable',
        c: node_stream.Writable,
        x: [1, 1, 2]
    },
    {
        n: 'Transform',
        c: node_stream.Transform,
        x: [1, 1, 2]
    },
    {
        n: 'Duplex',
        c: node_stream.Duplex,
        x: [1, 1, 2]
    },
    {
        n: 'PassThrough',
        c: node_stream.PassThrough,
        x: [1, 1, 2]
    },
    {
        n: 'Env',
        c: node_process.env.constructor,
        x: [1, 1, 2]
    }
];

exports.default = supplemental;
