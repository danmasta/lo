import { fromIp, fromIp4, fromIp6, toIp, toIp4, toIp6, isIp, isIp6, isIp4, ipFamily } from '../lib/ip.js';

let ip6 = {
    short: 'fe80::102:304',
    long: 'fe80:0000:0000:0000:0000:0000:0102:0304',
    mid: 'fe80:0:0:0:0:0:102:304',
    mixed: '1:2:3:4:5:6:77.77.88.88',
    arr: [65152, 0, 0, 0, 0, 0, 258, 772],
    uint16: new Uint16Array([65152, 0, 0, 0, 0, 0, 258, 772]),
    uint16Mixed: new Uint16Array([1, 2, 3, 4, 5, 6, 19789, 22616]),
    view: new DataView(new Uint8Array([254, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4]).buffer),
    viewMixed: new DataView(new Uint8Array([0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 77, 77, 88, 88]).buffer)
};

let ip4 = {
    short: '127.0.0.1',
    short6: '::7f00:1',
    long: '0000:0000:0000:0000:0000:0000:7f00:0001',
    arr: [127, 0, 0, 1],
    uint16: new Uint16Array([0, 0, 0, 0, 0, 0, 32512, 1]),
    view: new DataView(new Uint8Array([127, 0, 0, 1]).buffer),
    view6: new DataView(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 127, 0, 0, 1]).buffer)
};

// ipv4-mapped ipv6
let mapped = {
    short: '::ffff:172.17.0.1',
    long: '0000:0000:0000:0000:0000:ffff:172.17.0.1',
    uint16: new Uint16Array([0, 0, 0, 0, 0, 65535, 44049, 1]),
    uint8: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 172, 17, 0, 1]),
    view: new DataView(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 172, 17, 0, 1]).buffer)
};

describe('Ip', () => {

    it('toIp', () => {
        // ip6
        expect(toIp(ip6.uint16)).to.equal(ip6.short);
        expect(toIp6(ip6.uint16)).to.equal(ip6.short);
        expect(toIp6(ip6.uint16, 0, true)).to.equal(ip6.long);
        expect(toIp(fromIp('::'))).to.equal('::');
        expect(toIp(fromIp('::1'))).to.equal('::1');
        expect(toIp(fromIp('1::'))).to.equal('1::');
        expect(toIp(ip6.viewMixed)).to.equal('1:2:3:4:5:6:4d4d:5858');
        expect(toIp(fromIp('fe80::1.2.3.4'))).to.equal(ip6.short);
        // ip4
        expect(toIp(ip4.arr)).to.equal(ip4.short);
        expect(toIp4(ip4.arr)).to.equal(ip4.short);
        expect(toIp6(ip4.uint16)).to.equal(ip4.short6);
        expect(toIp6(ip4.uint16, 0, true)).to.equal(ip4.long);
        expect(toIp(fromIp(ip4.short))).to.equal(ip4.short);
        // mapped
        expect(toIp(mapped.uint16)).to.equal(mapped.short);
        expect(toIp(mapped.uint8)).to.equal(mapped.short);
        expect(toIp6(mapped.uint16)).to.equal(mapped.short);
        expect(toIp6(mapped.uint8)).to.equal(mapped.short);
        expect(toIp6(mapped.uint16, 0, true)).to.equal(mapped.long);
        expect(toIp(fromIp(mapped.short))).to.equal(mapped.short);
    });

    it('fromIp', () => {
        // ip6
        expect(fromIp(ip6.short)).to.eql(ip6.view);
        expect(fromIp6(ip6.short)).to.eql(ip6.view);
        expect(fromIp6(ip6.long)).to.eql(ip6.view);
        expect(fromIp6(ip6.mid)).to.eql(ip6.view);
        expect(fromIp('::1')).to.eql(new DataView(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]).buffer));
        expect(fromIp('1::')).to.eql(new DataView(new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer));
        expect(fromIp(ip6.mixed)).to.eql(ip6.viewMixed);
        // ip4
        expect(fromIp(ip4.short)).to.eql(ip4.view);
        expect(fromIp(ip4.short6)).to.eql(ip4.view6);
        expect(fromIp4(ip4.short)).to.eql(ip4.view);
        expect(fromIp(ip4.long)).to.eql(ip4.view6);
        expect(fromIp(toIp6(ip4.uint16, 0, true))).to.eql(ip4.view6);
        // mapped
        expect(fromIp(mapped.short)).to.eql(mapped.view);
        expect(fromIp(mapped.long)).to.eql(mapped.view);
        expect(fromIp(toIp(mapped.uint16))).to.eql(mapped.view);
        expect(fromIp(toIp(mapped.uint8))).to.eql(mapped.view);
        expect(fromIp(toIp(mapped.view))).to.eql(mapped.view);
    });

    it('isIp', () => {
        expect(isIp('::')).to.equal(6);
        expect(isIp('::1')).to.equal(6);
        expect(isIp('1::')).to.equal(6);
        expect(isIp('::ff')).to.equal(6);
        expect(isIp(ip4.short)).to.equal(4);
        expect(isIp(ip4.short6)).to.equal(6);
        expect(isIp(ip4.long)).to.equal(6);
        expect(isIp(mapped.short)).to.equal(6);
        expect(isIp(mapped.long)).to.equal(6);
        expect(isIp('127.0.0.1')).to.equal(4);
        expect(isIp('0.0.0.0')).to.equal(4);
        expect(isIp('255.255.255.255')).to.equal(4);
        expect(isIp('10.0.0.256')).to.equal(0);
        expect(isIp('1')).to.equal(0);
        expect(isIp('0')).to.equal(0);
        expect(isIp()).to.equal(0);
        expect(isIp('::ffffff')).to.equal(0);
        expect(isIp(ip6.short)).to.equal(6);
        expect(isIp(ip6.long)).to.equal(6);
        expect(isIp(ip6.mid)).to.equal(6);
        expect(isIp(ip6.mixed)).to.equal(6);
    });

    it('ipFamily', () => {
        expect(ipFamily('::1')).to.equal('ipv6');
        expect(ipFamily(ip4.short6)).to.equal('ipv6');
        expect(ipFamily('0.0.0.0')).to.equal('ipv4');
        expect(ipFamily(ip4.short)).to.equal('ipv4');
        expect(ipFamily()).to.be.null;
        expect(ipFamily('1')).to.be.null;
    });

});
