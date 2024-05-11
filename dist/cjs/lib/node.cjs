var constants = require('./constants.cjs');
var types = require('./types.cjs');
var path$1 = require('path');
var os = require('os');

function isStream (obj) {
    return obj instanceof constants.TYPES.Stream.ctor;
}

function isReadable (obj) {
    return types.getType(obj) === constants.TYPES.Readable;
}

function isWritable (obj) {
    return types.getType(obj) === constants.TYPES.Writable;
}

function isTransform (obj) {
    return types.getType(obj) === constants.TYPES.Transform;
}

function isDuplex (obj) {
    return types.getType(obj) === constants.TYPES.Duplex;
}

function isPassThrough (obj) {
    return types.getType(obj) === constants.TYPES.PassThrough;
}

// Resolve file path with support for home char and parent dir
function resolvePath (str, dir) {
    if (str[0] === '~') {
        return path$1.normalize(path.join(os.homedir(), str.slice(1)));
    } else {
        if (dir) {
            return path$1.resolve(dir, str);
        } else {
            return path$1.resolve(str);
        }
    }
}

exports.isDuplex = isDuplex;
exports.isPassThrough = isPassThrough;
exports.isReadable = isReadable;
exports.isStream = isStream;
exports.isTransform = isTransform;
exports.isWritable = isWritable;
exports.resolvePath = resolvePath;
