import { EventEmitter } from './events.js';

class Stream extends EventEmitter {}
const ReadableMixin = Super => class Readable extends Super {};
const WritableMixin = Super => class Writable extends Super {};

class Readable extends ReadableMixin(Stream) {}class Writable extends WritableMixin(Stream) {}
// Note: Use mixins to inherit Readable/Writable
// Using instanceof for Readable/Writable won't work here due to
// being a new separate class
let ReadWrite;
class Duplex extends (ReadWrite = WritableMixin(ReadableMixin(Stream))) {}class Transform extends Duplex {}class PassThrough extends Transform {}
var stream = {
    Stream,
    Readable,
    Writable,
    ReadWrite,
    Duplex,
    Transform,
    PassThrough
};

export { Duplex, PassThrough, ReadWrite, Readable, Stream, Transform, Writable, stream as default };
