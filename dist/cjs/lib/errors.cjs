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
        super('File or Directory Not Found: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_NOT_FOUND';
    }
}

class NotResolvedError extends LoError {
    constructor (path) {
        super('Unable to Resolve File or Directory: %s', path);
        this.path = path;
    }
    static get code () {
        return 'ERR_NOT_RESOLVED';
    }
}

exports.LoError = LoError;
exports.NotFoundError = NotFoundError;
exports.NotResolvedError = NotResolvedError;
