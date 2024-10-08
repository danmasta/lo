import { format } from './util.js';

export class BaseError extends Error {
    constructor (...args) {
        super(format(...args));
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = this.constructor.code;
    }
    static code = 'ERR';
}

export class NotFoundError extends BaseError {
    constructor (path) {
        super('File or directory not found: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_NOT_FOUND';
}

export class NotResolvedError extends BaseError {
    constructor (path) {
        super('File or directory not resolved: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_NOT_RESOLVED';
}

export class NotSupportedError extends BaseError {
    constructor (path) {
        super('File type not supported: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_NOT_SUPPORTED';
}

export class RequireAsyncError extends BaseError {
    constructor (path) {
        super('File requires async import: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_REQUIRE_ASYNC';
}

export class IpError extends BaseError {
    static code = 'ERR_IP';
}

export {
    BaseError as Error
};
