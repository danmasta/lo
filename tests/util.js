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
        let str = '1|2|3';
        expect(lo.split(str, '|')).to.eql(['1','2','3']);
        expect(lo.split(str, /[|]+/)).to.eql(['1','2','3']);
        expect(lo.split(str, '|', { limit: 1 })).to.eql(['1','2|3']);
        expect(lo.split(' 1 | 2 | 3 ', '|', { trim: true })).to.eql(['1','2','3']);
    });

});
