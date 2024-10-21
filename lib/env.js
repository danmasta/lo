import { env as ENV } from '#node:process';
import { isNil, toNativeType } from './types.js';

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
export function isNilEnv (val) {
    return isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/Setter for env vars
// Returns native types for primitive values
export function env (key, val) {
    switch (arguments.length) {
        case 1:
            return toNativeType(ENV[key]);
        case 2:
            let v = ENV[key];
            if (isNilEnv(v)) {
                return ENV[key] = val;
            }
            return toNativeType(v);
        default:
            return ENV;
    }
}

export {
    ENV
};
