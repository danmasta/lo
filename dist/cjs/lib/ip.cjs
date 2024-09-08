var constants = require('./constants.cjs');
var errors = require('./errors.cjs');
var iterate = require('./iterate.cjs');
var types = require('./types.cjs');

// Accepts an ArrayBuffer, DataView, TypedArray, Buffer, Array, or Iterable
// Size should be 4(ipv4) or 16(ipv6)
// Returns DataView
// Note: Using TypedArrays doesn't work because they default to the endianness
// of the system, which is most likely little-endian (x86, arm)
// Ip addresses should be big-endian (network order) (RFC 1700)
function toIpView (buf, size=16) {
    let type = types.getType(buf);
    switch (type) {
        case constants.TYPES.ArrayBuffer:
            return new DataView(buf, 0, size);
        case constants.TYPES.DataView:
            return buf;
        // Byte arrays don't have endianness
        case constants.TYPES.Uint8Array:
        case constants.TYPES.Buffer:
            return new DataView(buf.buffer, buf.byteOffset, size);
        // Convert to big-endian
        case constants.TYPES.Uint16Array: {
            let res = new DataView(new ArrayBuffer(size));
            for (let i = 0; i < size/2; i++) {
                res.setUint16(i*2, buf[i]);
            }
            return res;
        }
        // Array, Iterable
        default: {
            try {
                let res = new DataView(new ArrayBuffer(size));
                iterate.each(buf, (int, i) => {
                    if (size === 4) {
                        res.setUint8(i, int);
                    } else {
                        res.setUint16(i*2, int);
                    }
                });
                return res;
            } catch (err) {
                throw new errors.IpError('Failed to create ip view: %s', err.message);
            }
        }
    }
}

// Byte array to ipv4 string
function toIp4 (buf) {
    buf = toIpView(buf, 4);
    let res = [];
    for (let i = 0; i < 4; i++) {
        res.push(buf.getUint8(i));
    }
    return res.join('.');
}

// Byte array to ipv6 string
// Supports long and short style
function toIp6 (buf, long=0) {
    buf = toIpView(buf, 16);
    let ref;
    let res = [ref=[], []];
    for (let i = 0; i < 8; i++) {
        let int = buf.getUint16(i*2);
        if (int === 0) {
            if (long) {
                ref.push('0000');
            } else {
                ref = res[1];
            }
        } else {
            if (long) {
                ref.push(int.toString(16).padStart(4, '0'));
            } else {
                ref.push(int.toString(16));
            }
        }
    }
    if (ref === res[1]) {
        return res[0].join(':') + '::' + res[1].join(':');
    } else {
        return ref.join(':');
    }
}

// Byte array to ip string
// Supports ipv4 and ipv6
// Supports long and short style
function toIp (buf, long=0) {
    switch (buf?.byteLength ?? buf?.length ?? buf?.size) {
        case 2:
        case 4:
            return toIp4(buf);
        case 8:
        case 16:
            return toIp6(buf, long);
        default:
            throw new errors.IpError('Invalid ip length');
    }
}

// Ipv4 string to byte array
function fromIp4 (str='') {
    str = str.split('.');
    let res = new DataView(new ArrayBuffer(4));
    for (let i = 0; i < 4; i++) {
        res.setUint8(i, parseInt(str[i], 10));
    }
    return res;
}

// Ipv6 string parts to byte array
// Supports long and short style
function fromIp6Parts (start=[], end=[], ip4) {
    let res = new DataView(new ArrayBuffer(16));
    let len = start.length;
    let max = ip4 ? 6 : 8;
    let dif = max - end.length;
    for (let i = 0; i < max; i++) {
        let int;
        if (i < len) {
            int = parseInt(start.shift(), 16);
        } else if (i >= len && i < dif) {
            int = 0;
        } else {
            int = parseInt(end.shift(), 16);
        }
        res.setUint16(i*2, int);
    }
    if (ip4) {
        res.setUint32(12, fromIp4(ip4).getUint32());
    }
    return res;
}

// Ip string to byte array
// Supports ipv4 and ipv6
// Supports long and short style
function fromIp (str='', ip4=1) {
    let [start, end] = str.split('::');
    start = start.split(':');
    if (!end) {
        if (start.at(-1).includes('.')) {
            if (start.length === 1 && ip4) {
                return fromIp4(start.pop());
            }
            return fromIp6Parts(start, undefined, start.pop());
        }
        return fromIp6Parts(start);
    } else {
        end = end.split(':');
        if (end.at(-1).includes('.')) {
            return fromIp6Parts(start, end, end.pop());
        }
        return fromIp6Parts(start, end);
    }
}

// Ipv6 string to byte array
// Supports long and short style
function fromIp6 (str) {
    return fromIp(str, 0);
}

exports.fromIp = fromIp;
exports.fromIp4 = fromIp4;
exports.fromIp6 = fromIp6;
exports.fromIp6Parts = fromIp6Parts;
exports.toIp = toIp;
exports.toIp4 = toIp4;
exports.toIp6 = toIp6;
