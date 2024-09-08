var stream = require('stream');

var typesNode = [
    {
        n: 'Buffer',
        x: [1, 1, 2, 1]
    },
    {
        n: 'Stream',
        c: stream.Stream,
        x: [1, 1, 2]
    },
    {
        n: 'Readable',
        c: stream.Readable,
        x: [1, 1, 2]
    },
    {
        n: 'Writable',
        c: stream.Writable,
        x: [1, 1, 2]
    },
    {
        n: 'Transform',
        c: stream.Transform,
        x: [1, 1, 2]
    },
    {
        n: 'Duplex',
        c: stream.Duplex,
        x: [1, 1, 2]
    },
    {
        n: 'PassThrough',
        c: stream.PassThrough,
        x: [1, 1, 2]
    }
];

exports.default = typesNode;
