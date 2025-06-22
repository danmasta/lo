import path from 'node:path';
import { resolve } from '../polyfill/base/path.js';

describe('Polyfill', () => {

    it('path', () => {
        assert.equal(resolve(), path.resolve());
        assert.equal(resolve('.'), path.resolve('.'));
        assert.equal(resolve('..'), path.resolve('..'));
        assert.equal(resolve('./package.json'), path.resolve('./package.json'));
    });

});
