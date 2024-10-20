import { deburr, eachLine, mapLine, pad, padLeft, padLine, padLineLeft, padLineRight, padRight, split, trim, trimLeft, trimRight } from '../lib/util.js';

describe('Util', () => {

    it('flat', () => {
        expect(lo.flat([1,[2,[3]]])).to.eql([1,2,3]);
    });

    it('compact', () => {
        expect(lo.compact([1,null,2,undefined,3])).to.eql([1,2,3]);
    });

    it('flatCompact', () => {
        expect(lo.flatCompact([1,null,[2,null,[3,undefined]]])).to.eql([1,2,3]);
    });

    it('concat', () => {
        expect(lo.concat(1,2,3)).to.eql([1,2,3]);
        expect(lo.concat([1,2],[3,4])).to.eql([1,2,3,4]);
    });

    it('keys', () => {
        expect(lo.keys(fx.arr1)).to.eql(['0','1','2']);
        expect(lo.keys(fx.obj2)).to.eql(['1','2']);
    });

    it('join', () => {
        expect(lo.join(fx.arr1)).to.eql('1,2,3');
        expect(lo.join(fx.arr1, '')).to.eql('123');
        expect(lo.join(fx.obj1)).to.eql('');
    });

    it('split', () => {
        let str1 = '1|2|3';
        let strz = 'zero length';
        let strp = '--param "quoted match"';
        expect(split(str1, '|')).to.eql(['1','2','3']);
        expect(split(str1, /[|]+/)).to.eql(['1','2','3']);
        expect(split(str1, '|', { limit: 1 })).to.eql(['1','2|3']);
        expect(split(str1, /\|/, { limit: 1 })).to.eql(['1','2|3']);
        expect(split(' 1 | 2 | 3 ', '|', { trim: true })).to.eql(['1','2','3']);
        expect(split(strz, /\b/)).to.eql(['zero', ' ', 'length']);
        expect(split(strz, /\b/, { trim: 1 })).to.eql(['zero', 'length']);
        expect(split(strz, /\b/, { trim: 1, compact: 0 })).to.eql(['zero', '', 'length']);
        expect(split(strp, /\s/, { quotes: 0 })).to.eql(['--param', '"quoted', 'match"']);
        expect(split(strp, /\s/, { quotes: 1 })).to.eql(['--param', '"quoted match"']);
        expect(split(strp, /\s/, { quotes: 1, quote: "'" })).to.eql(['--param', '"quoted', 'match"']);
        expect(split(strp, /\s/, { quotes: 1, extract: 1 })).to.eql(['--param', 'quoted match']);
        expect(split(strp, ' ', { quotes: 1, extract: 1 })).to.eql(['--param', 'quoted match']);
        expect(split('split', '')).to.eql(['s','p','l','i','t']);
        expect(split('split', /(?:)/)).to.eql(['s','p','l','i','t']);
        expect(split('split', /.*/, { compact: 0 })).to.eql(['','']);
        expect(split('split "chars"', '', { quotes :1 })).to.eql(['s','p','l','i','t',' ','"chars"']);
        expect(split('split "chars"', '', { quotes: 1, extract: 1, trim: 1 })).to.eql(['s','p','l','i','t','chars']);
    });

    it('deburr', () => {
        expect(deburr('Açaí')).to.equal('Acai');
        expect(deburr('Crème Brûlée')).to.equal('Creme Brulee');
        expect(deburr('Thành phố Hồ Chí Minh')).to.equal('Thanh pho Ho Chi Minh');
    });

    it('pad', () => {
        let str = 'test';
        expect(pad(str, 6)).to.equal(' test ');
        expect(pad(str, 7)).to.equal(' test  ');
        expect(padLeft(str, 6)).to.equal('  test');
        expect(padRight(str, 6)).to.equal('test  ');
    });

    it('trim', () => {
        let str = ' test ';
        expect(trim(str)).to.equal('test');
        expect(trimLeft(str)).to.equal('test ');
        expect(trimRight(str)).to.equal(' test');
    });

    it ('eachLine', () => {
        let res = [];
        eachLine('1\r\n2\r3\n4', val => {
            res.push(val);
        });
        expect(res).to.eql(['1','2','3','4']);
    });

    it ('mapLine', () => {
        let res = mapLine('1\n2\n3', val => {
            return val*2;
        });
        expect(res).to.eql([2,4,6]);
    });

    it ('padLine', () => {
        let str = '1\n2\n3';
        expect(padLine(str, 2)).to.equal('1\n 2 \n 3 ');
        expect(padLine(str, 2, { head: 1, inclusive: 0 })).to.equal(' 1 \n 2 \n 3 ');
    });

    it ('padLineLeft', () => {
        let str = '1\n2\n3';
        expect(padLineLeft(str, 2)).to.equal('1\n  2\n  3');
        expect(padLineLeft(str, 2, { head: 1, char: '*' })).to.equal('**1\n**2\n**3');
    });

    it ('padLineRight', () => {
        let str = '1\n2\n3';
        expect(padLineRight(str, 2)).to.equal('1\n2  \n3  ');
        expect(padLineRight(str, 2, { head: 1 })).to.equal('1  \n2  \n3  ');
    });

});
