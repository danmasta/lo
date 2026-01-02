import { BREAK } from '../lib/constants.js';
import { lru } from '../lib/lru.js';

describe('LRU', () => {

    it('evict', () => {
        let n = 0;
        let cache = lru({
            max: 2,
            dispose: () => {
                n++;
            }
        });
        cache.set(1, 1);
        cache.set(2, 2);
        cache.set(3, 3);
        expect(cache.get(1)).to.be.undefined;
        expect(cache.get(2)).to.equal(2);
        expect(cache.get(3)).to.equal(3);
        expect(n).to.equal(1);
    });

    it('expire', done => {
        let n = 0;
        let cache = lru({
            ttl: 32,
            active: true,
            refresh: async (key, val) => {
                n++;
                if (val === 3) {
                    return BREAK;
                }
                return val * 2;
            }
        });
        cache.set(1, 1);
        cache.set(2, 2);
        cache.set(3, 3);
        expect(cache.get(1)).to.equal(1);
        expect(cache.get(2)).to.equal(2);
        expect(cache.get(3)).to.equal(3);
        setTimeout(() => {
            expect(cache.get(1)).to.equal(2);
            expect(cache.get(2)).to.equal(4);
            expect(cache.get(3)).to.be.undefined;
            expect(n).to.equal(3);
            done();
        }, 48);
    });

});
