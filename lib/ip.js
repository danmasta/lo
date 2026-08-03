import { TYPES } from './constants.js';
import { IPError } from './errors.js';
import { each } from './iterate.js';
import { getType } from './types.js';

// Accepts an ArrayBuffer, DataView, TypedArray, Buffer, Array, or Iterable
// Size should be 4(IPv4) or 16(IPv6)
// Returns DataView
// Note: Using TypedArrays doesn't work because they default to the endianness of
// the system, which is most likely little-endian (x86, arm)
// IP addresses should be big-endian (network order) (RFC 1700)
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
                throw new IPError('Failed to create IP view: %s', err.message);
            }
        }
    }
}

// Byte array to IPv4 string
export function toIp4 (buf, offset) {
    buf = toIpView(buf, offset, 4);
    let res = [];
    for (let i = 0; i < 4; i++) {
        res.push(buf.getUint8(i));
    }
    return res.join('.');
}

// Byte array to IPv6 string
// Supports long and short style
// Note: IPv4-mapped should be prefixed ::ffff:
// Note: IPv4-compatible is deprecated
export function toIp6 (buf, offset, long=0) {
    buf = toIpView(buf, offset, 16);
    let res = [];
    let mask = 0;
    let int;
    let match = -1;
    let len = 0;
    let cur = 0;
    for (let i = 0; i < 8; i++) {
        int = buf.getUint16(i * 2);
        // IPv4-mapped IPv6
        // https://datatracker.ietf.org/doc/html/rfc4291#section-2.5.5.2
        if (i === 5 && mask === 0 && int === 65535) {
            res.push('ffff', toIp4(buf, buf.byteOffset + 12));
            break;
        }
        if (long) {
            res.push(int.toString(16).padStart(4, '0'));
        } else {
            res.push(int.toString(16));
        }
        // Note: Track the longest zero-bit sequence (RFC 5952)
        if (int === 0) {
            if (++cur > len) {
                len = cur;
                match = i - cur + 1;
            }
        } else {
            cur = 0;
        }
        mask |= int;
    }
    if (long || len < 2) {
        return res.join(':');
    } else {
        return res.slice(0, match).join(':') + '::' + res.slice(match + len).join(':');
    }
}

// Byte array to IP string
// Supports IPv4 and IPv6
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
            throw new IPError('Invalid IP length');
    }
}

// IPv4 string to byte array
export function fromIp4 (ip='') {
    let arr = ip.split('.');
    if (arr.length !== 4 || ip.includes(':')) {
        throw new IPError('Invalid IPv4: %s', ip);
    }
    let n, res = new DataView(new ArrayBuffer(4));
    for (let i = 0; i < 4; i++) {
        n = parseInt(arr[i], 10);
        if ((n & 255) !== n) {
            throw new IPError('Invalid IPv4: %s', ip);
        }
        res.setUint8(i, n);
    }
    return res;
}

// IPv6 string parts to byte array
// Supports long and short style
export function fromIp6Parts ({ ip, short, head=[], tail=[], ip4 }={}) {
    let h = head.length;
    let t = tail.length;
    let max = ip4 ? 6 : 8;
    let bnd = max - t;
    if (!short) {
        if (h !== max) {
            throw new IPError('Invalid IPv6: %s', ip);
        }
    }
    if (h + t > max || h > bnd) {
        throw new IPError('Invalid IPv6: %s', ip);
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
            throw new IPError('Invalid IPv6: %s', ip);
        }
        res.setUint16(i * 2, n);
    }
    if (ip4) {
        res.setUint32(12, fromIp4(ip4).getUint32());
    }
    return res;
}

// IP string to byte array
// Supports IPv4 and IPv6
// Supports long and short style
export function fromIp (ip='', ip4=1) {
    if (!ip) {
        throw new IPError('Invalid IP: %s', ip);
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
                    throw new IPError('Invalid IPv6: %s', ip);
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

// IPv6 string to byte array
// Supports long and short style
export function fromIp6 (ip) {
    return fromIp(ip, 0);
}

export function isIp4 (ip) {
    try {
        return !!fromIp4(ip);
    } catch {
        return false;
    }
}

export function isIp6 (ip) {
    try {
        return !!fromIp6(ip);
    } catch {
        return false;
    }
}

export function isIp (ip) {
    if (isIp4(ip)) return 4;
    if (isIp6(ip)) return 6;
    return 0;
}

export function ipFamily (ip) {
    switch (isIp(ip)) {
        case 4:
            return 'ipv4';
        case 6:
            return 'ipv6';
        default:
            return null;
    }
}
