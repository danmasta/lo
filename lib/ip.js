import { TYPES } from './constants.js';
import { IpError } from './errors.js';
import { each } from './iterate.js';
import { getType } from './types.js';

// Accepts an ArrayBuffer, DataView, TypedArray, Buffer, Array, or Iterable
// Size should be 4(ipv4) or 16(ipv6)
// Returns DataView
// Note: Using TypedArrays doesn't work because they default to the endianness
// of the system, which is most likely little-endian (x86, arm)
// Ip addresses should be big-endian (network order) (RFC 1700)
function toIpView (buf, offset, size=16) {
    let type = getType(buf);
    switch (type) {
        case TYPES.ArrayBuffer:
            return new DataView(buf, offset ?? 0, size);
        case TYPES.DataView:
            return new DataView(buf.buffer, offset ?? buf.byteOffset, size);
        // Byte arrays don't have endianness
        case TYPES.Uint8Array:
        case TYPES.Buffer:
            return new DataView(buf.buffer, offset ?? buf.byteOffset, size);
        // Convert to big-endian
        case TYPES.Uint16Array: {
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
                each(buf, (int, i) => {
                    if (size === 4) {
                        res.setUint8(i, int);
                    } else {
                        res.setUint16(i * 2, int);
                    }
                });
                return res;
            } catch (err) {
                throw new IpError('Failed to create ip view: %s', err.message);
            }
        }
    }
}

// Byte array to ipv4 string
export function toIp4 (buf, offset) {
    buf = toIpView(buf, offset, 4);
    let res = [];
    for (let i = 0; i < 4; i++) {
        res.push(buf.getUint8(i));
    }
    return res.join('.');
}

// Byte array to ipv6 string
// Supports long and short style
export function toIp6 (buf, offset, long=0) {
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
            // Ipv4-mapped ipv6
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
export function toIp (buf, offset, long=0) {
    switch (buf?.byteLength ?? buf?.length ?? buf?.size) {
        case 2:
        case 4:
            return toIp4(buf, offset);
        case 8:
        case 16:
            return toIp6(buf, offset, long);
        default:
            throw new IpError('Invalid ip length');
    }
}

// Ipv4 string to byte array
export function fromIp4 (str='') {
    str = str.split('.');
    let res = new DataView(new ArrayBuffer(4));
    for (let i = 0; i < 4; i++) {
        res.setUint8(i, parseInt(str[i], 10));
    }
    return res;
}

// Ipv6 string parts to byte array
// Supports long and short style
export function fromIp6Parts (start=[], end=[], ip4) {
    let res = new DataView(new ArrayBuffer(16));
    let len = start.length;
    let max = ip4 ? 6 : 8;
    let dif = max - end.length;
    let int;
    for (let i = 0; i < max; i++) {
        if (i < len) {
            int = parseInt(start.shift(), 16);
        } else if (i >= len && i < dif) {
            int = 0;
        } else {
            int = parseInt(end.shift(), 16);
        }
        res.setUint16(i * 2, int);
    }
    if (ip4) {
        res.setUint32(12, fromIp4(ip4).getUint32());
    }
    return res;
}

// Ip string to byte array
// Supports ipv4 and ipv6
// Supports long and short style
export function fromIp (str='', ip4=1) {
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
export function fromIp6 (str) {
    return fromIp(str, 0);
}
