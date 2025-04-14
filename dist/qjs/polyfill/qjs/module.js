import { resolve } from './path.js';

function createRequire (dir='.') {
    const cache = new Map();
    function require (file) {
        let path = resolve(dir, file);
        if (cache.has(path)) {
            return cache.get(path);
        }
        // Note: We could use loadScript, but it doesn't support modules (esm, cjs)
        // We can only eval scripts without module support (import/export, require),
        //   which always return undefined, or use import which returns a promise
        // There is no way to execute code synchronously with modules,
        //   or any way to support cjs code, so not much point trying to emulate
        //   that behavior here for qjs
        // We could also compile and parse the bytecode with bjson write/read,
        //   but that ends up returning a promise as well
        let mod = import(path);
        cache.set(path, mod);
        return mod;
    }
    require.cache = cache;
    // Note: Does not resolve the same as regular require
    require.resolve = (file) => {
        return resolve(dir, file);
    };
    return require;
}

var module = {
    createRequire
};

export { createRequire, module as default };
