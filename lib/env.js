import { forOwn } from './iterate.js';
import { isObject, toNativeType } from './types.js';

// If a value was never set on env it will be undefined
// If a value was set on env that was undefined/null it becomes string 'undefined'/'null'
const unset = new Set([null, undefined, 'null', 'undefined']);

export const isUnset = val => unset.has(val);

// Create a getter/setter for env vars using get/set functions
// Note: Accepts an { override=boolean } arg as default or per-call option
// Note: Returns native types for primitive values
export function createEnv (get, set, defs) {
    return function env (key, val, opts) {
        if (isObject(key)) {
            // Note: Second argument becomes opts
            let { override=false } = { ...defs, ...val };
            forOwn(key, (v, k) => {
                if (override || isUnset(get(k))) {
                    set(k, v);
                }
            });
            return get();
        }
        switch (arguments.length) {
            case 1:
                return toNativeType(get(key));
            case 2:
            case 3:
                let { override=false } = { ...defs, ...opts };
                let v = get(key);
                if (override || isUnset(v)) {
                    set(key, v = val);
                }
                return toNativeType(v);
            default:
                return get();
        }
    };
}
