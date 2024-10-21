import { env as env$1 } from '../polyfill/qjs/process.js';
import { isNil, toNativeType } from './types.js';

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
function isNilEnv (val) {
    return isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/Setter for env vars
// Returns native types for primitive values
function env (key, val) {
    switch (arguments.length) {
        case 1:
            return toNativeType(env$1[key]);
        case 2:
            let v = env$1[key];
            if (isNilEnv(v)) {
                return env$1[key] = val;
            }
            return toNativeType(v);
        default:
            return env$1;
    }
}

export { env$1 as ENV, env, isNilEnv };
