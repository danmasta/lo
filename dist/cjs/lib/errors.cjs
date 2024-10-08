var util = require('./util.cjs');

class BaseError extends Error {
    constructor (...args) {
        super(util.format(...args));
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

class NotResolvedError extends BaseError {
    constructor (path) {
        super('File or directory not resolved: %s', path);
        this.path = path;
    }
    static code = 'ERR_FILE_NOT_RESOLVED';
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

exports.BaseError = BaseError;
exports.Error = BaseError;
exports.IpError = IpError;
exports.NotFoundError = NotFoundError;
exports.NotResolvedError = NotResolvedError;
exports.NotSupportedError = NotSupportedError;
exports.RequireAsyncError = RequireAsyncError;
