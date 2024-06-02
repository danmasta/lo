import { format } from 'node:util';

export class LoError extends Error {
    constructor (...args) {
        super(format(...args));
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = this.constructor.code;
    }
    static get code () {
        return 'ERR';
    }
}

export class NotFoundError extends LoError {
    constructor (path) {
        super('File or Directory Not Found: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_NOT_FOUND';
    }
}

export class NotResolvedError extends LoError {
    constructor (path) {
        super('Unable to Resolve File or Directory: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_NOT_RESOLVED';
    }
}
