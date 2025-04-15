import { EventEmitter } from './events.js';

export class Stream extends EventEmitter {};

const ReadableMixin = Super => class Readable extends Super {};
const WritableMixin = Super => class Writable extends Super {};

export class Readable extends ReadableMixin(Stream) {};
export class Writable extends WritableMixin(Stream) {};

export let ReadWrite;

// Note: Use mixins to inherit Readable/Writable
// Using instanceof for Readable/Writable won't work due to
// being a new separate class
export class Duplex extends (ReadWrite = WritableMixin(ReadableMixin(Stream))) {};
export class Transform extends Duplex {};
export class PassThrough extends Transform {};

export default {
    Stream,
    Readable,
    Writable,
    ReadWrite,
    Duplex,
    Transform,
    PassThrough
};
