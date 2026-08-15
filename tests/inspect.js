import { Buffer } from 'node:buffer';
import { inspect } from '../lib/inspect.js';

describe('Inspect', () => {

    it('primitives', () => {
        expect(inspect(undefined)).to.equal('undefined');
        expect(inspect(null)).to.equal('null');
        expect(inspect(true)).to.equal('true');
        expect(inspect(42)).to.equal('42');
        expect(inspect(-0)).to.equal('-0');
        expect(inspect(NaN)).to.equal('NaN');
        expect(inspect(Infinity)).to.equal('Infinity');
        expect(inspect(10n)).to.equal('10n');
        expect(inspect(Symbol('x'))).to.equal('Symbol(x)');
    });

    it('strings', () => {
        expect(inspect('abc')).to.equal("'abc'");
        // Switch to double quotes to avoid escaping
        expect(inspect("it's")).to.equal('"it\'s"');
        expect(inspect('a\nb')).to.equal("'a\\nb'");
        // Named control escapes and \xNN fallback (upper hex, C1 range, no \v)
        expect(inspect('a\tb\r')).to.equal("'a\\tb\\r'");
        expect(inspect('\b\f\v')).to.equal("'\\b\\f\\x0B'");
        expect(inspect('\x00\x1b\x7f')).to.equal("'\\x00\\x1B\\x7F'");
        expect(inspect('\x80\x9f')).to.equal("'\\x80\\x9F'");
    });

    it('array', () => {
        expect(inspect([1,2,3])).to.equal('[ 1, 2, 3 ]');
        expect(inspect([])).to.equal('[]');
        // Sparse holes
        expect(inspect([1,,,4])).to.equal('[ 1, <2 empty items>, 4 ]');
    });

    it('object', () => {
        expect(inspect({})).to.equal('{}');
        expect(inspect({ a: 1, b: 2 })).to.equal('{ a: 1, b: 2 }');
        // Quoted and numeric keys
        expect(inspect({ 'a-b': 1, 2: 'x' })).to.equal("{ '2': 'x', 'a-b': 1 }");
    });

    it('nested', () => {
        expect(inspect({ a: 1, b: { c: 2, d: [1,2] } })).to.equal('{ a: 1, b: { c: 2, d: [ 1, 2 ] } }');
    });

    it('depth', () => {
        expect(inspect({ a: { b: { c: { d: 1 } } } })).to.equal('{ a: { b: { c: [Object] } } }');
        expect(inspect({ a: { b: { c: { d: 1 } } } }, { depth: null })).to.equal('{ a: { b: { c: { d: 1 } } } }');
        expect(inspect([[[[1]]]], { depth: 1 })).to.equal('[ [ [Array] ] ]');
    });

    it('multiline', () => {
        // Breaks above the entry threshold
        expect(inspect({ a:1, b:2, c:3, d:4, e:5, f:6, g:7 })).to.equal(
            '{\n  a: 1,\n  b: 2,\n  c: 3,\n  d: 4,\n  e: 5,\n  f: 6,\n  g: 7\n}'
        );
    });

    it('map', () => {
        expect(inspect(new Map([['a',1],['b',2]]))).to.equal("Map(2) { 'a' => 1, 'b' => 2 }");
        expect(inspect(new Map())).to.equal('Map(0) {}');
    });

    it('set', () => {
        expect(inspect(new Set([1,2,3]))).to.equal('Set(3) { 1, 2, 3 }');
        expect(inspect(new Set())).to.equal('Set(0) {}');
    });

    it('typedArray', () => {
        expect(inspect(new Uint8Array([1,2,3]))).to.equal('Uint8Array(3) [ 1, 2, 3 ]');
    });

    it('buffer', () => {
        expect(inspect(Buffer.from('test'))).to.equal('<Buffer 74 65 73 74>');
    });

    it('regexp', () => {
        expect(inspect(/ab+c/gi)).to.equal('/ab+c/gi');
    });

    it('date', () => {
        expect(inspect(new Date('2020-01-01T00:00:00Z'))).to.equal('2020-01-01T00:00:00.000Z');
        expect(inspect(new Date('invalid'))).to.equal('Invalid Date');
    });

    it('error', () => {
        let err = new TypeError('boom');
        expect(inspect(err)).to.equal(err.stack);
    });

    it('function', () => {
        expect(inspect(function foo(){})).to.equal('[Function: foo]');
        expect(inspect(() => {})).to.equal('[Function (anonymous)]');
        expect(inspect(async function bar(){})).to.equal('[AsyncFunction: bar]');
    });

    it('class', () => {
        class Animal {}
        class Dog extends Animal {}
        expect(inspect(Animal)).to.equal('[class Animal]');
        expect(inspect(Dog)).to.equal('[class Dog extends Animal]');
        expect(inspect(new Animal())).to.equal('Animal {}');
    });

    it('promise', () => {
        expect(inspect(Promise.resolve(1))).to.equal('Promise { <pending> }');
    });

    it('weak', () => {
        expect(inspect(new WeakMap())).to.equal('WeakMap { <items unknown> }');
        expect(inspect(new WeakSet())).to.equal('WeakSet { <items unknown> }');
    });

    it('iterators', () => {
        expect(inspect([1,2][Symbol.iterator]())).to.equal('[Array Iterator]');
        expect(inspect(new Map([['a',1]]).entries())).to.equal('[Map Iterator]');
        function* g(){ yield 1; }
        expect(inspect(g())).to.equal('[Generator]');
        async function* ag(){ yield 1; }
        expect(inspect(ag())).to.equal('[AsyncGenerator]');
    });

    it('circular', () => {
        let obj = { a: 1 };
        obj.self = obj;
        expect(inspect(obj)).to.equal('{ a: 1, self: [Circular] }');
        // Sibling refs to the same object don't count as circular
        let shared = { x: 1 };
        expect(inspect({ a: shared, b: shared })).to.equal('{ a: { x: 1 }, b: { x: 1 } }');
    });

    it('showHidden', () => {
        let obj = {};
        Object.defineProperty(obj, 'hidden', { value: 1, enumerable: false });
        expect(inspect(obj)).to.equal('{}');
        expect(inspect(obj, { showHidden: true })).to.equal('{ hidden: 1 }');
    });

    it('getters', () => {
        let obj = { get a() { return 1; } };
        expect(inspect(obj)).to.equal('{ a: [Getter] }');
    });

    it('colors', () => {
        expect(inspect(42, { colors: true })).to.equal('\x1b[33m42\x1b[39m');
        expect(inspect('x', { colors: true })).to.equal("\x1b[32m'x'\x1b[39m");
        expect(inspect(null, { colors: true })).to.equal('\x1b[1mnull\x1b[22m');
    });

});
