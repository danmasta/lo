describe('Iterate', () => {

    it('each', () => {
        let count = 0;
        lo.each(fx.arr1, val => {
            count++;
        });
        expect(count).to.equal(3);
    });

    it('eachNotNil', () => {
        let count = 0;
        lo.eachNotNil(fx.arr2, val => {
            count++;
        });
        expect(count).to.equal(3);
    });

    it('map', () => {
        let res = lo.map(fx.arr1, val => {
            return val*2;
        });
        expect(res).to.eql([2,4,6]);
    });

    it('mapNotNil', () => {
        let res1 = lo.mapNotNil(fx.arr2, val => {
            return val*2;
        });
        let res2 = lo.mapNotNil(fx.arr2, val => {
            return val % 2 === 0 ? null : val;
        });
        expect(res1).to.eql([2,4,6]);
        expect(res2).to.eql([1,3]);
    });

});
