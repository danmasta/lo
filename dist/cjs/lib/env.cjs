var node_process = require('node:process');
var types = require('./types.cjs');

// If a value was never set on process.env it will return typeof undefined
// If a value was set on process.env that was typeof undefined it will become string 'undefined'
function isNilEnv (val) {
    return types.isNil(val) || val === 'undefined' || val === 'null';
}

// Getter/Setter for env vars
// Returns native types for primitive values
function env (key, val) {
    switch (arguments.length) {
        case 1:
            return types.toNativeType(node_process.env[key]);
        case 2:
            let v = node_process.env[key];
            if (isNilEnv(v)) {
                return node_process.env[key] = val;
            }
            return types.toNativeType(v);
        default:
            return node_process.env;
    }
}

Object.defineProperty(exports, "ENV", {
    enumerable: true,
    get: function () { return node_process.env; }
});
exports.env = env;
exports.isNilEnv = isNilEnv;
