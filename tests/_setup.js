import { assert, expect, should } from 'chai';
import lo from '../index.js';
import { TYPES } from '../lib/constants.js';
import { Readable } from 'stream';

class TestClass {}
class TestError extends Error {}
class TestErrorTwo extends TestError {}
class TestArray extends Array {}
const arrow = () => {};
const fn = function () {};
const promise = new Promise(arrow);

const fixtures = {
    TestClass,
    TestError,
    TestErrorTwo,
    TestArray,
    readable: new Readable(),
    arrow,
    fn,
    Readable,
    promise
};

beforeEach(() => {
    global.assert = assert;
    global.expect = expect;
    global.should = should();
    global.lo = lo;
    global.TYPES = TYPES;
    global.fixtures = fixtures;
    global.fx = fixtures;
});
