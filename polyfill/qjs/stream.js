class EventEmitter {};
export class Stream extends EventEmitter {};
export class Readable extends Stream {};
export class Writable extends Stream {};
// Note: Duplex should technically inherit Readable and Writable
export class Duplex extends Stream {};
export class Transform extends Duplex {};
export class PassThrough extends Transform {};

export default {
    Stream,
    Readable,
    Writable,
    Duplex,
    Transform,
    PassThrough
};
