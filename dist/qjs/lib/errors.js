import { format } from './util.js';

class BaseError extends Error {
    constructor (...args) {
        super(format(...args));
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = this.constructor.code;
    }
    static code = 'ERR';
}

class NotFoundError extends BaseError {
    constructor (path) {
        super('File or directory not found: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_NOT_FOUND';
}

class NotSupportedError extends BaseError {
    constructor (path) {
        super('File type not supported: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_NOT_SUPPORTED';
}

class RequireAsyncError extends BaseError {
    constructor (path) {
        super('File requires async import: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_REQUIRE_ASYNC';
}

class IpError extends BaseError {
    static code = 'ERR_IP';
}

export { BaseError, BaseError as Error, IpError, NotFoundError, NotSupportedError, RequireAsyncError };
