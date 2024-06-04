var node_util = require('node:util');

class LoError extends Error {
    constructor (...args) {
        super(node_util.format(...args));
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = this.constructor.code;
    }
    static get code () {
        return 'ERR';
    }
}

class NotFoundError extends LoError {
    constructor (path) {
        super('File or directory not found: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_NOT_FOUND';
    }
}

class NotResolvedError extends LoError {
    constructor (path) {
        super('File or directory not resolved: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_NOT_RESOLVED';
    }
}

class NotSupportedError extends LoError {
    constructor (path) {
        super('File type not supported: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_NOT_SUPPORTED';
    }
}

class RequireAsyncError extends LoError {
    constructor (path) {
        super('File requires async import: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_FILE_REQUIRE_ASYNC';
    }
}

exports.LoError = LoError;
exports.NotFoundError = NotFoundError;
exports.NotResolvedError = NotResolvedError;
exports.NotSupportedError = NotSupportedError;
exports.RequireAsyncError = RequireAsyncError;
