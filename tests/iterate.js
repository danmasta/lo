import { drop, take, find, reduce, transform, flatMap } from '../lib/iterate.js';
import { BREAK } from '../lib/constants.js';

async function* toAsync (arr) {
    yield* arr;
}

describe('Iterate', () => {

    it('forIn', async () => {
        let res = {};
        lo.forIn(fx.obj3, (val, key) => {
            res[key] = val;
        });
        expect(res).to.eql({1:1,3:3});
        let res2 = {};
        await lo.forIn(fx.obj3, async (val, key) => {
            res2[key] = await Promise.resolve(val);
        });
        expect(res2).to.eql({1:1,3:3});
    });

    it('forOwn', async () => {
        let res = {};
        lo.forOwn(fx.obj3, (val, key) => {
            res[key] = val;
        });
        expect(res).to.eql({3:3});
        let res2 = {};
        await lo.forOwn(fx.obj3, async (val, key) => {
            res2[key] = await Promise.resolve(val);
        });
        expect(res2).to.eql({3:3});
    });

    it('forEach', async () => {
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
        // Await each call and preserve order
        let res3 = [];
        await lo.forEach(fx.arr1, async val => {
            res3.push(await Promise.resolve(val * 10));
        });
        expect(res3).to.eql([10,20,30]);
        // Iterate map entries as val/key
        let res4 = [];
        await lo.forEach(fx.map, async (val, key) => {
            res4.push(await Promise.resolve(key + ':' + val));
        });
        expect(res4).to.eql(['1:2','3:4']);
        // Break iteration early with BREAK
        let res5 = [];
        await lo.forEach(fx.arr1, async val => {
            res5.push(val);
            if (val === 2) {
                return BREAK;
            }
        });
        expect(res5).to.eql([1,2]);
        // Non-collection falls back to single-item collection
        let res6 = [];
        await lo.forEach(fx.obj1, async val => {
            res6.push(await Promise.resolve(val));
        });
        expect(res6).to.eql([{1:1}]);
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
        let count2 = 0;
        lo.each(fx.arr2, val => {
            count2++;
        }, { notNil: true });
        expect(count2).to.equal(3);
    });

    it('each entries', () => {
        let res = {};
        lo.each(fx.obj1, (val, key) => {
            res[key] = val;
        }, { entries: true });
        expect(res).to.eql({1:1});
    });

    it('map', async () => {
        let res = lo.map(fx.arr1, val => {
            return val*2;
        });
        expect(res).to.eql([2,4,6]);
        expect(await lo.map(fx.arr1, async val => {
            return val*2;
        })).to.eql([2,4,6]);
        let res1 = lo.map(fx.arr2, val => {
            return val*2;
        }, { notNil: true });
        let res2 = lo.map(fx.arr2, val => {
            return val % 2 === 0 ? null : val;
        }, { notNil: true });
        expect(res1).to.eql([2,4,6]);
        expect(res2).to.eql([1,3]);
    });

    it('tap', async () => {
        let res = lo.tap(fx.arr1, val => {
            return val*2;
        });
        expect(res).to.eql([1,2,3]);
        expect(await lo.tap(fx.arr1, async val => {
            return val*2;
        })).to.eql([1,2,3]);
        let res2 = lo.tap(fx.arr2, val => {
            return val*2;
        }, { notNil: true });
        expect(res2).to.eql([1,2,3]);
    });

    it('some', async () => {
        let res = lo.some(fx.arr1, val => {
            return val % 2 === 0 ? true: false;
        });
        expect(res).to.be.true;
        expect(await lo.some(fx.arr1, async val => {
            return val % 2 === 0 ? true: false;
        })).to.be.true;
        let res2 = lo.some(fx.arr2, val => {
            return val % 2 === 0 ? true: false;
        }, { notNil: true });
        expect(res2).to.be.true;
    });

    it('every', async () => {
        let res = lo.every(fx.arr1, val => {
            return val % 2 === 0 ? true: false;
        });
        expect(res).to.be.false;
        expect(await lo.every(fx.arr1, async val => {
            return val % 2 === 0 ? true: false;
        })).to.be.false;
        let res2 = lo.every(fx.arr2, val => {
            return val % 2 === 0 ? true: false;
        }, { notNil: true });
        expect(res2).to.be.false;
    });

    it('filter', async () => {
        let res = lo.filter(fx.arr1, val => {
            return val % 2 === 0 ? true : false;
        });
        expect(res).to.eql([2]);
        expect(await lo.filter(fx.arr1, async val => {
            return val % 2 === 0 ? true : false;
        })).to.eql([2]);
        let res2 = lo.filter(fx.arr2, val => {
            return val % 2 === 0 ? true : false;
        }, { notNil: true });
        expect(res2).to.eql([2]);
    });

    it('remove', async () => {
        let res = lo.remove(fx.arr1, val => {
            return val % 2 === 0 ? true : false;
        });
        expect(res).to.eql([1,3]);
        expect(await lo.remove(fx.arr1, async val => {
            return val % 2 === 0 ? true : false;
        })).to.eql([1,3]);
        let res2 = lo.remove(fx.arr2, val => {
            return val % 2 === 0 ? true : false;
        }, { notNil: true });
        expect(res2).to.eql([1,3]);
    });

    it('drop', async () => {
        expect(drop([1,2,3], 1)).to.eql([2,3]);
        expect(await drop(toAsync([1,2,3]), 1)).to.eql([2,3]);
        expect(drop([1,null,3], 1, { notNil: true })).to.eql([3]);
    });

    it('take', async () => {
        expect(take([1,2,3], 2)).to.eql([1,2]);
        expect(await take(toAsync([1,2,3]), 2)).to.eql([1,2]);
        expect(take([1,null,3], 2, { notNil: true })).to.eql([1,3]);
    });

    it('find', async () => {
        expect(find([1,2,3], val => {
            return val % 3 === 0;
        })).to.eql(3);
        expect(await find(toAsync([1,2,3]), async val => {
            return val % 3 === 0;
        })).to.eql(3);
        expect(find([1,null,3], val => {
            return val % 3 === 0;
        }, { notNil: true })).to.eql(3);
    });

    it('reduce', async () => {
        expect(reduce([1,2,3], (acc, val) => {
            return acc += val;
        })).to.eql(6);
        expect(await reduce(toAsync([1,2,3]), async (acc, val) => {
            return acc += val;
        })).to.eql(6);
        expect(reduce([1,null,3], (acc, val) => {
            if (val % 3 === 0) {
                return acc += val;
            }
        }, undefined, { notNil: true })).to.eql(3);
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
        expect(transform([1,null,3], (acc, val) => {
            if (val % 3 === 0) {
                return acc.push(val);
            }
        }, undefined, { notNil: true })).to.eql([3]);
        expect(transform(10)).to.equal(0);
        expect(transform(10, null, 10)).to.equal(10);
    });

    it('flatMap', async () => {
        expect(flatMap([[1,1],[2,2],[3,3]], val => {
            return val;
        })).to.eql([1,1,2,2,3,3]);
        expect(flatMap([[1,1],[2,2],[3,3]], val => {
            return val;
        }, 0)).to.eql([[1,1],[2,2],[3,3]]);
        expect(await flatMap(toAsync([[1,1],[2,2],[3,3]]), async val => {
            return val;
        })).to.eql([1,1,2,2,3,3]);
        // Nested async recursion (recursive descendant promise also awaited)
        expect(await flatMap(toAsync([[1,2],[3,[4,5]]]), async val => {
            return val;
        }, Infinity)).to.eql([1,2,3,4,5]);
        expect(flatMap([[1,null],[2,undefined],null], val => {
            return val;
        }, undefined, { notNil: true })).to.eql([1,2]);
        expect(flatMap([[1,null],[2,undefined],[3,3]], val => {
            if (val % 3 === 0) {
                return undefined;
            }
            return val;
        }, undefined, { notNil: true })).to.eql([1,2]);
        expect(flatMap(10)).to.eql([10]);
        expect(flatMap(10, null)).to.eql([10]);
    });

});
