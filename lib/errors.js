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
        super('File or directory not found: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_NOT_FOUND';
    }
}

export class NotResolvedError extends LoError {
    constructor (path) {
        super('File or directory not resolved: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_NOT_RESOLVED';
    }
}

export class NotSupportedError extends LoError {
    constructor (path) {
        super('File type not supported: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_NOT_SUPPORTED';
    }
}

export class RequireAsyncError extends LoError {
    constructor (path) {
        super('File requires async import: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_REQUIRE_ASYNC';
    }
}
