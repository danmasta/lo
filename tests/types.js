import { EventEmitter } from 'node:events';
import { env } from 'node:process';
import { StringDecoder } from 'node:string_decoder';
import { runInNewContext } from 'node:vm';
import { settings, TYPES } from '../lib/constants.js';
import {
    getCtorType,
    getType,
    hasForEach,
    isCollection,
    isError,
    of,
    toArray,
    toString,
    toType
} from '../lib/types.js';

describe('Types', () => {

    it('get type by instance', async () => {
        // Instances should be type of the constructor
        expect(getType({})).to.equal(TYPES.Object);
        expect(getType([])).to.equal(TYPES.Array);
        expect(getType(Object.create(Number.prototype))).to.equal(TYPES.Number);
        expect(getType(Object.create(null))).to.equal(TYPES.Object);
        expect(getType(Object.create({}))).to.equal(TYPES.Object);
        expect(getType(123)).to.equal(TYPES.Number);
        expect(getType(new Number(123))).to.equal(TYPES.Number);
        expect(getType(true)).to.equal(TYPES.Boolean);
        expect(getType(new Date)).to.equal(TYPES.Date);
        expect(getType(NaN)).to.equal(TYPES.NaN);
        expect(getType(null)).to.equal(TYPES.Null);
        expect(getType(undefined)).to.equal(TYPES.Undefined);
        expect(getType(fx.arrow)).to.equal(TYPES.Function);
        expect(getType(fx.fn)).to.equal(TYPES.Function);
        expect(getType(fx.promise)).to.equal(TYPES.Promise);
        expect(getType(new fx.TestArray)).to.equal(TYPES.Array);
        expect(getType(fx.readable)).to.equal(TYPES.Readable);
        expect(getType(fx.buff)).to.equal(TYPES.Buffer);
        expect(getType(new EventEmitter)).to.equal(TYPES.EventEmitter);
        expect(getType(new StringDecoder)).to.equal(TYPES.StringDecoder);
        expect(getType(await import('../lib/types.js'))).to.equal(TYPES.Module);
        expect(getType(env)).to.equal(TYPES.Env);
        // Constructor functions should be type of Function
        expect(getType(Promise)).to.equal(TYPES.Function);
        expect(getType(Boolean)).to.equal(TYPES.Function);
        expect(getType(fx.TestClass)).to.equal(TYPES.Function);
        expect(getType(fx.TestError)).to.equal(TYPES.Function);
        expect(getType(fx.TestArray)).to.equal(TYPES.Function);
        // Accept type objects
        expect(getType(TYPES.Array)).to.equal(TYPES.Array);
        expect(getType(TYPES.Set)).to.equal(TYPES.Set);
    });

    it('get type by constructor', () => {
        expect(getCtorType(Promise)).to.equal(TYPES.Promise);
        expect(getCtorType(Boolean)).to.equal(TYPES.Boolean);
        expect(getCtorType(Date)).to.equal(TYPES.Date);
        expect(getCtorType(NaN)).to.equal(TYPES.NaN);
        expect(getCtorType(null)).to.equal(TYPES.Null);
        expect(getCtorType(undefined)).to.equal(TYPES.Undefined);
        expect(getCtorType(Error)).to.equal(TYPES.Error);
        expect(getCtorType(fx.Readable)).to.equal(TYPES.Readable);
    });

    // Toggle settings.addUnknownTypes and verify unknown user-defined subclasses
    // resolve to their own type (not the nearest registered parent)
    it('add unknown types', () => {
        settings.addUnknownTypes = true;
        // Get type by instance
        expect(getType(new fx.TestClass)).to.equal(TYPES.TestClass);
        expect(getType(new fx.TestSubClass)).to.equal(TYPES.TestSubClass);
        expect(getType(new fx.TestError)).to.equal(TYPES.TestError);
        expect(getType(new fx.TestSubError)).to.equal(TYPES.TestSubError);
        // Get type by constructor
        expect(getCtorType(fx.TestClass)).to.equal(TYPES.TestClass);
        expect(getCtorType(fx.TestSubClass)).to.equal(TYPES.TestSubClass);
        expect(getCtorType(fx.TestError)).to.equal(TYPES.TestError);
        expect(getCtorType(fx.TestSubError)).to.equal(TYPES.TestSubError);
        expect(getCtorType(fx.TestArray)).to.equal(TYPES.TestArray);
        settings.addUnknownTypes = false;
    });

    it('get type for exotic callables', () => {
        // Async/Generator functions
        expect(getType(async () => {})).to.equal(TYPES.AsyncFunction);
        expect(getType(function* () {})).to.equal(TYPES.GeneratorFunction);
        expect(getType(async function* () {})).to.equal(TYPES.AsyncGeneratorFunction);
        // Callables with non-Function constructor and no known toStringTag resolve to Function
        class Fn extends Function {}
        expect(getType(new Fn)).to.equal(TYPES.Function);
        // Cross-realm functions have a foreign Function constructor
        expect(getType(runInNewContext('(function () {})'))).to.equal(TYPES.Function);
        expect(getType(runInNewContext('(async () => {})'))).to.equal(TYPES.AsyncFunction);
        // Never return undefined
        expect(getType(new Fn)).to.not.be.undefined;
    });

    it('get type for extended spec types', () => {
        // Native error subtypes
        expect(getType(new TypeError)).to.equal(TYPES.TypeError);
        expect(getType(new RangeError)).to.equal(TYPES.RangeError);
        expect(getType(new SyntaxError)).to.equal(TYPES.SyntaxError);
        expect(getType(new AggregateError([]))).to.equal(TYPES.AggregateError);
        expect(isError(new TypeError)).to.be.true;
        // Binary and iterator additions
        expect(getType(new Float16Array(1))).to.equal(TYPES.Float16Array);
        expect(getType(''.matchAll(/(?:)/g))).to.equal(TYPES['RegExp String Iterator']);
        // Web platform types
        expect(getType(new TextEncoder)).to.equal(TYPES.TextEncoder);
        expect(getType(new AbortController)).to.equal(TYPES.AbortController);
        expect(getType(AbortSignal.abort())).to.equal(TYPES.AbortSignal);
        expect(getType(new Event('x'))).to.equal(TYPES.Event);
        expect(getType(new CustomEvent('x'))).to.equal(TYPES.CustomEvent);
        expect(getType(new DOMException)).to.equal(TYPES.DOMException);
        // MessagePort inherits EventTarget's toStringTag, but the constructor still resolves
        expect(getType(new MessageChannel().port1)).to.equal(TYPES.EventTarget);
        expect(getCtorType(MessagePort)).to.equal(TYPES.MessagePort);
        // Iterable collections
        expect(isCollection(new Float16Array(1))).to.be.true;
        expect(hasForEach(new Float16Array(1))).to.be.true;
        expect(isCollection(''.matchAll(/(?:)/g))).to.be.true;
    });

    it('cast to type', () => {
        expect(toType(Boolean, 1)).to.be.a('boolean');
        expect(toType(Array, 1)).to.be.an.instanceof(Array);
        expect(toType(fx.TestArray, 1)).to.be.an.instanceof(Array);
        expect(toType(fx.TestError, 1)).to.be.an.instanceof(Error);
        expect(toType(String, 1)).to.be.a('string');
        expect(toType(BigInt, 1)).to.be.a('bigint');
        expect(toType(Map, [[1, 2]])).to.be.an.instanceof(Map);
        expect(toType(Set, [1, 2])).to.be.an.instanceof(Set);
    });

    it('isType', () => {
        expect(isError(new Error)).to.be.true;
        expect(isError(new fx.TestError)).to.be.true;
    });

    it('isClass', () => {
        expect(lo.isClass(fx.TestClass)).to.be.true;
        expect(lo.isClass(fx.TestSubClass)).to.be.true;
        expect(lo.isClass(fx.fn)).to.be.false;
        // Arrow functions have no prototype descriptor
        expect(lo.isClass(fx.arrow)).to.be.false;
    });

    it('toArray', () => {
        expect(toArray(null)).to.eql([]);
        expect(toArray(undefined)).to.eql([]);
        expect(toArray(1,2,3)).to.eql([1,2,3]);
        expect(toArray([1,2,3])).to.eql([1,2,3]);
        expect(toArray('123')).to.eql(['1','2','3']);
        expect(toArray('123', '123')).to.eql(['1','2','3','1','2','3']);
        expect(toArray({1: 1})).to.eql([{1: 1}]);
        expect(toArray({1: 1}, {2: 2})).to.eql([{1: 1}, {2: 2}]);
        expect(toArray(true)).to.eql([true]);
        expect(toArray(fx.set)).to.eql([1,2,3]);
        expect(toArray(fx.map)).to.eql([[1,2],[3,4]]);
    });

    it('toString', () => {
        expect(toString(null)).to.equal('');
        expect(toString(undefined)).to.equal('');
        expect(toString(NaN)).to.equal('NaN');
        expect(toString([1,2,3])).to.equal('1,2,3');
        expect(toString(true)).to.equal('true');
        expect(toString(123)).to.equal('123');
        expect(toString(BigInt(123))).to.equal('123');
        expect(toString(fx.buff)).to.equal('test');
        // Symbol coerces without throwing
        expect(toString(Symbol('x'))).to.equal('Symbol(x)');
        // Objects without meaningful toString fall back to tag
        expect(toString({1: 1, 2: 2})).to.equal('[object Object]');
        expect(toString(new WeakMap())).to.equal('[object WeakMap]');
        // Re-iterable collections render contents
        expect(toString(new Set([1, 2, 3]))).to.equal('1,2,3');
        expect(toString(new Map([['a', 1]]))).to.equal('a,1');
        // One-shot iterators are tagged (not consumed)
        let it = [1, 2, 3][Symbol.iterator]();
        expect(toString(it)).to.equal('[object Array Iterator]');
        expect(it.next().value).to.equal(1);
    });

    it('of', () => {
        expect(of([1,2,3])).to.eql([]);
        expect(of({1:1})).to.eql({});
        expect(of(10)).to.eql(0);
        expect(of(true)).to.equal(false);
        expect(of('test')).to.equal('');
        expect(of(new Set([1,2,3]))).to.eql(new Set())
        expect(of(new Map([[1,1],[2,2],[3,3]]))).to.eql(new Map())
    });

});
