import { cwd, isWin32 } from '#polyfill/core';
import { dirname, resolve } from '#polyfill/path';
import { fileURLToPath } from '#polyfill/url';

// Resolve the base directory from a filename, file URL, or directory path
function getBaseDir (input) {
    if (input == null) {
        return cwd();
    }
    let path = fileURLToPath(input);
    // Note: Trailing sep marks an explicit directory
    // Otherwise treat the input as a filename and resolve from its parent directory (like node)
    let last = path.at(-1);
    if (last === '/' || (isWin32 && last === '\\')) {
        return path;
    }
    return dirname(path);
}

export function createRequire (filename) {
    const dir = getBaseDir(filename);
    const cache = new Map();
    // Note: Path resolution only
    // Does no existence check, extension, directory, or node_modules resolution
    function requireResolve (file) {
        return resolve(dir, file);
    }
    // Note: Returns a promise for the module (not sync like regular require)
    function require (file) {
        let path = requireResolve(file);
        if (cache.has(path)) {
            return cache.get(path);
        }
        // Note: We could use loadScript, but it doesn't support modules (ESM, CJS)
        // And we can only eval scripts without module support (import/export, require),
        //   which always return undefined, or use import which returns a promise
        // There is no way to execute code synchronously with modules, or
        //   any way to support CJS code, so not much point trying to emulate
        //   that behavior here for QuickJS
        // We could also compile and parse the bytecode with bjson write/read,
        //   but that ends up returning a promise as well
        let mod = import(path);
        cache.set(path, mod);
        // Note: Evict rejected imports for retry (validate it hasn't been replaced)
        mod.catch(() => {
            if (cache.get(path) === mod) {
                cache.delete(path);
            }
        });
        return mod;
    }
    require.cache = cache;
    require.resolve = requireResolve;
    return require;
}

export default {
    createRequire
};
