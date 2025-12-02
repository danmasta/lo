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
function toIpView (buf, offset, size=16) {
    let type = types.getType(buf);
    switch (type) {
        case constants.TYPES.ArrayBuffer:
            return new DataView(buf, offset ?? 0, size);
        case constants.TYPES.DataView:
            return new DataView(buf.buffer, offset ?? buf.byteOffset, size);
        // Byte arrays don't have endianness
        case constants.TYPES.Uint8Array:
        case constants.TYPES.Buffer:
            return new DataView(buf.buffer, offset ?? buf.byteOffset, size);
        // Convert to big-endian
        case constants.TYPES.Uint16Array: {
            let res = new DataView(new ArrayBuffer(size));
            for (let i = 0; i < size / 2; i++) {
                res.setUint16(i * 2, buf[i]);
            }
            return res;
        }
        // Array or Iterable
        default: {
            try {
                let res = new DataView(new ArrayBuffer(size));
                iterate.each(buf, (int, i) => {
                    if (size === 4) {
                        res.setUint8(i, int);
                    } else {
                        res.setUint16(i * 2, int);
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
function toIp4 (buf, offset) {
    buf = toIpView(buf, offset, 4);
    let res = [];
    for (let i = 0; i < 4; i++) {
        res.push(buf.getUint8(i));
    }
    return res.join('.');
}

// Byte array to ipv6 string
// Supports long and short style
function toIp6 (buf, offset, long=0) {
    buf = toIpView(buf, offset, 16);
    let res = [[], []];
    let ref = res[0];
    let mask = 0;
    let int;
    for (let i = 0; i < 8; i++) {
        int = buf.getUint16(i * 2);
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
            // Ipv4-mapped Ipv6
            // https://datatracker.ietf.org/doc/html/rfc4291#section-2.5.5.2
            if (i === 5 && mask === 0 && int === 65535) {
                ref.push(toIp4(buf, buf.byteOffset + 12));
                break;
            }
            mask |= int;
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
function toIp (buf, offset, long=0) {
    switch (buf?.byteLength ?? buf?.length ?? buf?.size) {
        case 2:
        case 4:
            return toIp4(buf, offset);
        case 8:
        case 16:
            return toIp6(buf, offset, long);
        default:
            throw new errors.IpError('Invalid ip length');
    }
}

// Ipv4 string to byte array
function fromIp4 (ip='') {
    let arr = ip.split('.');
    if (arr.length !== 4 || ip.includes(':')) {
        throw new errors.IpError('Invalid ipv4: %s', ip);
    }
    let n, res = new DataView(new ArrayBuffer(4));
    for (let i = 0; i < 4; i++) {
        n = parseInt(arr[i], 10);
        if ((n & 255) !== n) {
            throw new errors.IpError('Invalid ipv4: %s', ip);
        }
        res.setUint8(i, n);
    }
    return res;
}

// Ipv6 string parts to byte array
// Supports long and short style
function fromIp6Parts ({ ip, short, head=[], tail=[], ip4 }={}) {
    let h = head.length;
    let t = tail.length;
    let max = ip4 ? 6 : 8;
    let bnd = max - t;
    if (!short) {
        if (h !== max) {
            throw new errors.IpError('Invalid ipv6: %s', ip);
        }
    }
    if (h + t > max || h > bnd) {
        throw new errors.IpError('Invalid ipv6: %s', ip);
    }
    let n, res = new DataView(new ArrayBuffer(16));
    for (let i = 0; i < max; i++) {
        if (i < h) {
            n = parseInt(head.shift(), 16);
        } else if (i >= h && i < bnd) {
            n = 0;
        } else {
            n = parseInt(tail.shift(), 16);
        }
        if ((n & 65535) !== n) {
            throw new errors.IpError('Invalid ipv6: %s', ip);
        }
        res.setUint16(i * 2, n);
    }
    if (ip4) {
        res.setUint32(12, fromIp4(ip4).getUint32());
    }
    return res;
}

// Ip string to byte array
// Supports ipv4 and ipv6
// Supports long and short style
function fromIp (ip='', ip4=1) {
    if (!ip) {
        throw new errors.IpError('Invalid ip: %s', ip);
    }
    let sub = ip.split('::'), [head, tail] = sub;
    let short = sub.length === 2;
    head = head && head.split(':') || undefined;
    if (!tail) {
        if (head?.at(-1)?.includes('.')) {
            if (head.length === 1) {
                if (ip4) {
                    return fromIp4(head.pop());
                } else {
                    throw new errors.IpError('Invalid ipv6: %s', ip);
                }
            }
            return fromIp6Parts({ ip, short, head, ip4: head.pop() });
        }
        return fromIp6Parts({ ip, short, head });
    } else {
        tail = tail.split(':');
        if (tail.at(-1).includes('.')) {
            return fromIp6Parts({ ip, short, head, tail, ip4: tail.pop() });
        }
        return fromIp6Parts({ ip, short, head, tail });
    }
}

// Ipv6 string to byte array
// Supports long and short style
function fromIp6 (ip) {
    return fromIp(ip, 0);
}

function isIp4 (ip) {
    try {
        return !!fromIp4(ip);
    } catch {
        return false;
    }
}

function isIp6 (ip) {
    try {
        return !!fromIp6(ip);
    } catch {
        return false;
    }
}

function isIp (ip) {
    if (isIp4(ip)) return 4;
    if (isIp6(ip)) return 6;
    return 0;
}

function ipFamily (ip) {
    switch (isIp(ip)) {
        case 4:
            return 'ipv4';
        case 6:
            return 'ipv6';
        default:
            return null;
    }
}

exports.fromIp = fromIp;
exports.fromIp4 = fromIp4;
exports.fromIp6 = fromIp6;
exports.fromIp6Parts = fromIp6Parts;
exports.ipFamily = ipFamily;
exports.isIp = isIp;
exports.isIp4 = isIp4;
exports.isIp6 = isIp6;
exports.toIp = toIp;
exports.toIp4 = toIp4;
exports.toIp6 = toIp6;
