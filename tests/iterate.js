describe('Iterate', () => {

    it('forIn', () => {
        let res = {};
        lo.forIn(fx.obj3, (val, key) => {
            res[key] = val;
        });
        expect(res).to.eql({1:1,3:3});
    });

    it('forOwn', () => {
        let res = {};
        lo.forOwn(fx.obj3, (val, key) => {
            res[key] = val;
        });
        expect(res).to.eql({3:3});
    });

    it('forEach', () => {
        let res1 = [];
        lo.forEach(fx.arr1, val => {
            res1.push(val);
        });
        expect(res1).to.eql([1,2,3]);
        let res2 = [];
        lo.forEach(fx.obj1, val => {
            res2.push(val);
        });
        expect(res2).to.eql([{1:1}]);
    });

    it('iterate', () => {
        let res1 = [];
        lo.iterate(fx.obj1, val => {
            res1.push(val);
        });
        expect(res1).to.eql([{1:1}]);
        let res2 = {};
        lo.iterate(fx.obj1, (val, key) => {
            res2[key] = val;
        }, false);
        expect(res2).to.eql({1:1});
    });

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

    it('tap', () => {
        let res = lo.tap(fx.arr1, val => {
            return val*2;
        });
        expect(res).to.eql([1,2,3]);
    });

    it('tapNotNil', () => {
        let res = lo.tapNotNil(fx.arr2, val => {
            return val*2;
        });
        expect(res).to.eql([1,2,3]);
    });

    it('some', () => {
        let res = lo.some(fx.arr1, val => {
            return val % 2 === 0 ? true: false;
        });
        expect(res).to.be.true;
    });

    it('someNotNil', () => {
        let res = lo.someNotNil(fx.arr2, val => {
            return val % 2 === 0 ? true: false;
        });
        expect(res).to.be.true;
    });

    it('every', () => {
        let res = lo.every(fx.arr1, val => {
            return val % 2 === 0 ? true: false;
        });
        expect(res).to.be.false;
    });

    it('everyNotNil', () => {
        let res = lo.everyNotNil(fx.arr2, val => {
            return val % 2 === 0 ? true: false;
        });
        expect(res).to.be.false;
    });

    it('filter', () => {
        let res = lo.filter(fx.arr1, val => {
            return val % 2 === 0 ? true : false;
        });
        expect(res).to.eql([2]);
    });

    it('filterNotNil', () => {
        let res = lo.filterNotNil(fx.arr2, val => {
            return val % 2 === 0 ? true : false;
        });
        expect(res).to.eql([2]);
    });

    it('remove', () => {
        let res = lo.remove(fx.arr1, val => {
            return val % 2 === 0 ? true : false;
        });
        expect(res).to.eql([1,3]);
    });

    it('removeNotNil', () => {
        let res = lo.removeNotNil(fx.arr2, val => {
            return val % 2 === 0 ? true : false;
        });
        expect(res).to.eql([1,3]);
    });

});
