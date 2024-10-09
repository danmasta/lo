import { TYPES } from '../lib/constants.js';

describe('Types', () => {

    it('get type by instance', async () => {
        // Instances should be type of the constructor
        expect(lo.getType({})).to.equal(TYPES.Object);
        expect(lo.getType([])).to.equal(TYPES.Array);
        expect(lo.getType(Object.create(Number.prototype))).to.equal(TYPES.Number);
        expect(lo.getType(Object.create(null))).to.equal(TYPES.Object);
        expect(lo.getType(Object.create({}))).to.equal(TYPES.Object);
        expect(lo.getType(123)).to.equal(TYPES.Number);
        expect(lo.getType(new Number(123))).to.equal(TYPES.Number);
        expect(lo.getType(true)).to.equal(TYPES.Boolean);
        expect(lo.getType(new Date)).to.equal(TYPES.Date);
        expect(lo.getType(NaN)).to.equal(TYPES.NaN);
        expect(lo.getType(null)).to.equal(TYPES.Null);
        expect(lo.getType(undefined)).to.equal(TYPES.Undefined);
        expect(lo.getType(fx.arrow)).to.equal(TYPES.Function);
        expect(lo.getType(fx.fn)).to.equal(TYPES.Function);
        expect(lo.getType(fx.promise)).to.equal(TYPES.Promise);
        expect(lo.getType(new fx.TestClass)).to.equal(TYPES.Unknown);
        expect(lo.getType(new fx.TestError)).to.equal(TYPES.Error);
        expect(lo.getType(new fx.TestErrorTwo)).to.equal(TYPES.Error);
        expect(lo.getType(new fx.TestArray)).to.equal(TYPES.Array);
        expect(lo.getType(fx.readable)).to.equal(TYPES.Readable);
        expect(lo.getType(fx.buff)).to.equal(TYPES.Buffer);
        expect(lo.getType(await import('../lib/types.js'))).to.equal(TYPES.Module);
        // Constructor functions should be type of Function
        expect(lo.getType(Promise)).to.equal(TYPES.Function);
        expect(lo.getType(Boolean)).to.equal(TYPES.Function);
        expect(lo.getType(fx.TestClass)).to.equal(TYPES.Function);
        expect(lo.getType(fx.TestError)).to.equal(TYPES.Function);
        expect(lo.getType(fx.TestArray)).to.equal(TYPES.Function);
    });

    it('get type by constructor', () => {
        expect(lo.getCtorType(Promise)).to.equal(TYPES.Promise);
        expect(lo.getCtorType(Boolean)).to.equal(TYPES.Boolean);
        expect(lo.getCtorType(Date)).to.equal(TYPES.Date);
        expect(lo.getCtorType(NaN)).to.equal(TYPES.NaN);
        expect(lo.getCtorType(null)).to.equal(TYPES.Null);
        expect(lo.getCtorType(undefined)).to.equal(TYPES.Undefined);
        expect(lo.getCtorType(Error)).to.equal(TYPES.Error);
        expect(lo.getCtorType(fx.TestClass)).to.equal(TYPES.Function);
        expect(lo.getCtorType(fx.TestClassTwo)).to.equal(TYPES.Function);
        expect(lo.getCtorType(fx.TestError)).to.equal(TYPES.Error);
        expect(lo.getCtorType(fx.TestErrorTwo)).to.equal(TYPES.Error);
        expect(lo.getCtorType(fx.TestArray)).to.equal(TYPES.Array);
        expect(lo.getCtorType(fx.Readable)).to.equal(TYPES.Readable);
    });

    it('cast to type', () => {
        expect(lo.toType(Boolean, 1)).to.be.a('boolean');
        expect(lo.toType(Array, 1)).to.be.an.instanceof(Array);
        expect(lo.toType(fx.TestArray, 1)).to.be.an.instanceof(Array);
        expect(lo.toType(fx.TestError, 1)).to.be.an.instanceof(Error);
        expect(lo.toType(String, 1)).to.be.a('string');
        expect(lo.toType(BigInt, 1)).to.be.a('bigint');
        expect(lo.toType(Map, [[1, 2]])).to.be.an.instanceof(Map);
        expect(lo.toType(Set, [1, 2])).to.be.an.instanceof(Set);
    });

    it('isType', () => {
        expect(lo.isError(new Error)).to.be.true;
        expect(lo.isError(new fx.TestError)).to.be.true;
    });

    it('toArray', () => {
        expect(lo.toArray(null)).to.eql([]);
        expect(lo.toArray(undefined)).to.eql([]);
        expect(lo.toArray(1,2,3)).to.eql([1,2,3]);
        expect(lo.toArray([1,2,3])).to.eql([1,2,3]);
        expect(lo.toArray('123')).to.eql(['1','2','3']);
        expect(lo.toArray('123', '123')).to.eql(['1','2','3','1','2','3']);
        expect(lo.toArray({1: 1})).to.eql([{1: 1}]);
        expect(lo.toArray({1: 1}, {2: 2})).to.eql([{1: 1}, {2: 2}]);
        expect(lo.toArray(true)).to.eql([true]);
        expect(lo.toArray(fx.set)).to.eql([1,2,3]);
        expect(lo.toArray(fx.map)).to.eql([[1,2],[3,4]]);
    });

    it('toString', () => {
        expect(lo.toString(null)).to.equal('');
        expect(lo.toString(undefined)).to.equal('');
        expect(lo.toString(NaN)).to.equal('NaN');
        expect(lo.toString([1,2,3])).to.equal('1,2,3');
        expect(lo.toString({1: 1, 2: 2})).to.equal('1,1,2,2');
        expect(lo.toString(true)).to.equal('true');
        expect(lo.toString(123)).to.equal('123');
        expect(lo.toString(BigInt(123))).to.equal('123');
        expect(lo.toString(fx.buff)).to.equal('test');
    });

});
