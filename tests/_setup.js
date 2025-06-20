import { assert, expect, should } from 'chai';
import lo from '../index.js';
import { Readable } from 'stream';
import { Buffer } from 'node:buffer';

class TestClass {}
class TestSubClass extends TestClass {}
class TestError extends Error {}
class TestSubError extends TestError {}
class TestArray extends Array {}
const arrow = () => {};
const fn = function () {};
const promise = new Promise(arrow);
const arr1 = [1,2,3];
const arr2 = [1,null,2,undefined,3];
const map = new Map([[1,2],[3,4]]);
const set = new Set([1,2,3]);
const obj1 = {1:1};
const obj2 = {1:1,2:{2:2}};
const obj3 = Object.create(obj1, { 3: {
    value: 3,
    enumerable: true
}});
const buff = Buffer.from('test');

const fixtures = {
    TestClass,
    TestSubClass,
    TestError,
    TestSubError,
    TestArray,
    readable: new Readable(),
    arrow,
    fn,
    Readable,
    promise,
    arr1,
    arr2,
    map,
    set,
    obj1,
    obj2,
    obj3,
    buff
};

beforeEach(() => {
    global.assert = assert;
    global.expect = expect;
    global.should = should();
    global.lo = lo;
    global.fixtures = fixtures;
    global.fx = fixtures;
});
