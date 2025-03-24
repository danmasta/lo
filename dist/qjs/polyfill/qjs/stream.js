import { EventEmitter } from './events.js';

class Stream extends EventEmitter {}class Readable extends Stream {}class Writable extends Stream {}// Note: Duplex should technically inherit Readable and Writable
class Duplex extends Stream {}class Transform extends Duplex {}class PassThrough extends Transform {}

export { Duplex, PassThrough, Readable, Stream, Transform, Writable };
