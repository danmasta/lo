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

class IpError extends BaseError {
    static code = 'ERR_IP';
}

export { BaseError, BaseError as Error, IpError };
