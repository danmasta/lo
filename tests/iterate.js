import { drop, dropNotNil, take, takeNotNil, find, findNotNil, reduce, reduceNotNil, transform, transformNotNil } from '../lib/iterate.js';

async function* toAsync (arr) {
    yield* arr;
}

describe('Iterate', () => {

    it('forIn', () => {
        let res = {};
        lo.forIn(fx.obj3, (val, key) => {
            res[key] = val;
        });
        expect(res).to.eql({1:1,3:3});
    });

    it('forInAsync', async () => {
        let res = {};
        await lo.forIn(fx.obj3, async (val, key) => {
            res[key] = await Promise.resolve(val);
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

    it('forOwnAsync', async () => {
        let res = {};
        await lo.forOwn(fx.obj3, async (val, key) => {
            res[key] = await Promise.resolve(val);
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

    it('drop', async () => {
        expect(drop([1,2,3], 1)).to.eql([2,3]);
        expect(await drop(toAsync([1,2,3]), 1)).to.eql([2,3]);
        expect(dropNotNil([1,null,3], 1)).to.eql([3]);
    });

    it('take', async () => {
        expect(take([1,2,3], 2)).to.eql([1,2]);
        expect(await take(toAsync([1,2,3]), 2)).to.eql([1,2]);
        expect(takeNotNil([1,null,3], 2)).to.eql([1,3]);
    });

    it('find', async () => {
        expect(find([1,2,3], val => {
            return val % 3 === 0;
        })).to.eql(3);
        expect(await find(toAsync([1,2,3]), async val => {
            return val % 3 === 0;
        })).to.eql(3);
        expect(findNotNil([1,null,3], val => {
            return val % 3 === 0;
        })).to.eql(3);
    });

    it('reduce', async () => {
        expect(reduce([1,2,3], (acc, val) => {
            return acc += val;
        })).to.eql(6);
        expect(await reduce(toAsync([1,2,3]), async (acc, val) => {
            return acc += val;
        })).to.eql(6);
        expect(reduceNotNil([1,null,3], (acc, val) => {
            if (val % 3 === 0) {
                return acc += val;
            }
        })).to.eql(3);
        expect(reduce(10)).to.equal(0);
        expect(reduce(10, null, 10)).to.equal(10);
    });

    it('transform', async () => {
        expect(transform([1,2,3], (acc, val) => {
            acc.push(val);
        })).to.eql([1,2,3]);
        expect(await transform(toAsync([1,2,3]), async (acc, val) => {
            acc.push(val);
        }, [])).to.eql([1,2,3]);
        expect(transformNotNil([1,null,3], (acc, val) => {
            if (val % 3 === 0) {
                return acc.push(val);
            }
        })).to.eql([3]);
        expect(transform(10)).to.equal(0);
        expect(transform(10, null, 10)).to.equal(10);
    });

});
