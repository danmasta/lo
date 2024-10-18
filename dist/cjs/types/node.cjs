var node_stream = require('node:stream');

var typesNode = [
    {
        n: 'Buffer',
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
    }
];

exports.default = typesNode;
