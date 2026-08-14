import { BREAK } from '../lib/constants.js';
import { each, map } from '../lib/iterate.js';
import { LRU, lru } from '../lib/lru.js';
import { mono } from '../lib/time.js';

const sleep = ms => new Promise(res => setTimeout(res, ms));

describe('LRU', () => {

    // Deterministic monotonic clock for passive (timer-free) tests
    // Note: They advance time synchronously instead of sleeping
    let realNow = mono.now;
    afterEach(() => {
        mono.now = realNow;
    });
    const clock = () => {
        let now = 0;
        mono.now = () => now;
        return ms => {
            now += ms;
        };
    };

    it('evict', () => {
        let n = 0;
        let cache = lru({
            max: 2,
            onDispose: () => {
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

    it('evict order follows access order', () => {
        let cache = lru({ max: 2 });
        cache.set(1, 1);
        cache.set(2, 2);
        cache.get(1);
        cache.set(3, 3);
        expect(cache.has(1)).to.be.true;
        expect(cache.has(2)).to.be.false;
        expect(cache.has(3)).to.be.true;
    });

    it('normalize max', () => {
        let off = lru({ max: -1 });
        off.set(1, 1);
        expect(off.size).to.equal(0);
        let all = lru({ max: Infinity });
        all.set(1, 1);
        all.set(2, 2);
        expect(all.size).to.equal(2);
        expect(all.isFull()).to.be.false;
    });

    it('expire', async () => {
        let n = 0;
        let cache = lru({
            ttl: 32,
            active: 10,
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
        await sleep(48);
        expect(cache.get(1)).to.equal(2);
        expect(cache.get(2)).to.equal(4);
        expect(cache.get(3)).to.be.undefined;
        expect(n).to.equal(3);
    });

    it('expire passive', () => {
        let advance = clock();
        let cache = lru({ ttl: 16, stale: false });
        cache.set(1, 1);
        expect(cache.get(1)).to.equal(1);
        advance(24);
        expect(cache.get(1)).to.be.undefined;
        expect(cache.size).to.equal(0);
    });

    it('expire sync refresh', async () => {
        let n = 0;
        let cache = lru({
            ttl: 16,
            stale: false,
            refresh: (key, val) => {
                n++;
                return val + 1;
            }
        });
        cache.set(1, 1);
        await sleep(24);
        // Refresh always lands asynchronously, sync or not
        expect(cache.get(1)).to.be.undefined;
        expect(cache.get(1)).to.be.undefined;
        await sleep(8);
        expect(cache.get(1)).to.equal(2);
        expect(n).to.equal(1);
    });

    it('refresh does not clobber a write made while running', async () => {
        let cache = lru({
            ttl: 16,
            refresh: async () => {
                await sleep(24);
                return 'refreshed';
            }
        });
        cache.set(1, 'orig');
        await sleep(24);
        cache.get(1);
        cache.set(1, 'user');
        await sleep(40);
        expect(cache.get(1)).to.equal('user');
    });

    it('refresh does not undo a delete or clear made while running', async () => {
        let opts = {
            ttl: 16,
            refresh: async () => {
                await sleep(24);
                return 'refreshed';
            }
        };
        let deleted = lru(opts);
        deleted.set(1, 'orig');
        await sleep(24);
        deleted.get(1);
        deleted.delete(1);
        let cleared = lru(opts);
        cleared.set(1, 'orig');
        await sleep(24);
        cleared.get(1);
        cleared.clear();
        await sleep(40);
        expect(deleted.size).to.equal(0);
        expect(cleared.size).to.equal(0);
    });

    it('concurrent reads trigger one refresh', async () => {
        let n = 0;
        let cache = lru({
            ttl: 16,
            refresh: async (key, val) => {
                n++;
                return val + 1;
            }
        });
        cache.set(1, 1);
        await sleep(24);
        expect(cache.get(1)).to.equal(1);
        expect(cache.get(1)).to.equal(1);
        expect(cache.get(1)).to.equal(1);
        await sleep(8);
        expect(n).to.equal(1);
        expect(cache.get(1)).to.equal(2);
    });

    it('ttl is absolute', () => {
        let advance = clock();
        let cache = lru({ ttl: 40, stale: false });
        let seen = [];
        cache.set(1, 1);
        for (let i = 0; i < 5; i++) {
            advance(10);
            seen.push(cache.get(1));
        }
        expect(seen.at(0)).to.equal(1);
        expect(seen.at(-1)).to.be.undefined;
    });

    it('idle is sliding', () => {
        let advance = clock();
        let cache = lru({ idle: 40, stale: false });
        cache.set(1, 1);
        for (let i = 0; i < 5; i++) {
            advance(10);
            expect(cache.get(1)).to.equal(1);
        }
        advance(48);
        expect(cache.get(1)).to.be.undefined;
    });

    it('ttl caps idle', () => {
        let advance = clock();
        let cache = lru({ ttl: 60, idle: 25, stale: false });
        cache.set(1, 1);
        // Note: Reads stay inside idle, so only ttl can expire the record
        for (let i = 0; i < 5; i++) {
            advance(15);
            cache.get(1);
        }
        expect(cache.get(1)).to.be.undefined;
    });

    it('overwrite does not expire early', async () => {
        let seen = [];
        let cache = lru({
            ttl: 40,
            active: 10,
            refresh: (key, val) => {
                seen.push(val);
                return val;
            }
        });
        cache.set(1, 'old');
        await sleep(30);
        cache.set(1, 'new');
        await sleep(30);
        expect(seen).to.not.include('old');
        expect(cache.get(1)).to.equal('new');
    });

    it('uses one timer for all records', () => {
        let cache = lru({ ttl: 64, active: true });
        for (let i = 0; i < 20; i++) {
            cache.set(i, i);
        }
        expect(cache.timer).to.not.be.undefined;
        expect([...cache.cache.values()].every(rec => rec.timer === undefined)).to.be.true;
        cache.clear();
        expect(cache.timer).to.be.undefined;
    });

    it('sweep gap scales with size', () => {
        // Note: Gap tracks size only past the crossover at FLOOR * SCALE
        let n = LRU.FLOOR * LRU.SCALE * 2;
        let cache = lru({ max: Infinity, ttl: 60_000, active: true });
        expect(cache.gap()).to.equal(LRU.FLOOR);
        for (let i = 0; i < n; i++) {
            cache.set(i, i);
        }
        expect(cache.gap()).to.be.above(LRU.FLOOR);
        expect(cache.gap()).to.equal(n / LRU.SCALE);
    });

    it('sweep gap can be pinned', () => {
        let cache = lru({ max: 100_000, ttl: 60_000, active: 250 });
        expect(cache.gap()).to.equal(250);
        for (let i = 0; i < 20_000; i++) {
            cache.set(i, i);
        }
        expect(cache.gap()).to.equal(250);
    });

    it('active expires unread records', async () => {
        let seen = [];
        let cache = lru({
            ttl: 24,
            active: 10,
            stale: false,
            refresh: key => {
                seen.push(key);
                return BREAK;
            }
        });
        cache.set(1, 1);
        cache.set(2, 2);
        await sleep(48);
        // Neither key was ever read, the sweep expired both
        expect(seen).to.eql([1, 2]);
        expect(cache.size).to.equal(0);
    });

    it('active with idle re-arms across sweeps', async () => {
        let n = 0;
        let cache = lru({
            idle: 40,
            active: 10,
            stale: false,
            refresh: () => {
                n++;
                return BREAK;
            }
        });
        cache.set(1, 1);
        for (let i = 0; i < 5; i++) {
            await sleep(10);
            expect(cache.get(1)).to.equal(1);
        }
        expect(n).to.equal(0);
        await sleep(72);
        expect(n).to.equal(1);
        expect(cache.size).to.equal(0);
    });

    it('sweep does not duplicate an in-flight refresh', async () => {
        let n = 0;
        // Note: Disable timer so only the manual sweeps race the refresh
        let cache = lru({
            ttl: 24,
            refresh: async (key, val) => {
                n++;
                await sleep(32);
                return val + 1;
            }
        });
        cache.set(1, 1);
        await sleep(32);
        cache.get(1);
        cache.sweep();
        cache.sweep();
        expect(n).to.equal(1);
        await sleep(40);
        expect(cache.get(1)).to.equal(2);
        expect(n).to.equal(1);
    });

    it('refresh failure serves stale and retries', async () => {
        let n = 0;
        let errs = [];
        let cache = lru({
            ttl: 24,
            refresh: async () => {
                n++;
                throw new Error('rejected');
            },
            onError: err => {
                errs.push(err.message);
            }
        });
        cache.set(1, 1);
        await sleep(32);
        expect(cache.get(1)).to.equal(1);
        await sleep(8);
        expect(n).to.equal(1);
        expect(errs).to.eql(['rejected']);
        expect(cache.get(1)).to.equal(1);
        expect(n).to.equal(1);
        await sleep(32);
        cache.get(1);
        await sleep(8);
        expect(n).to.equal(2);
    });

    it('refresh failure drops the record when not stale', async () => {
        let cache = lru({
            ttl: 24,
            stale: false,
            refresh: async () => {
                throw new Error('rejected');
            }
        });
        cache.set(1, 1);
        await sleep(32);
        expect(cache.get(1)).to.be.undefined;
        await sleep(8);
        expect(cache.size).to.equal(0);
    });

    it('refresh failure does not drop a write made while running', async () => {
        let cache = lru({
            ttl: 40,
            stale: false,
            refresh: async () => {
                await sleep(10);
                throw new Error('rejected');
            },
            onError: () => {}
        });
        cache.set(1, 'old');
        await sleep(48);
        // Expired, triggers a failing refresh
        expect(cache.get(1)).to.be.undefined;
        cache.set(1, 'new');
        await sleep(20);
        // Settle drops the record when not stale (but only the same record)
        expect(cache.get(1)).to.equal('new');
    });

    it('refresh failure does not misreport freshness', async () => {
        let cache = lru({
            ttl: 24,
            refresh: async () => {
                throw new Error('rejected');
            }
        });
        cache.set(1, 1);
        await sleep(32);
        cache.get(1);
        await sleep(8);
        expect(cache.isExpired(1)).to.be.true;
        expect(cache.expires(1)).to.equal(0);
    });

    it('dispose failure does not resurrect an evicted record', async () => {
        let cache = lru({
            max: 1,
            ttl: 24,
            active: 10,
            onDispose: () => {
                throw new Error('rejected');
            },
            refresh: (key, val) => val,
            onError: () => {}
        });
        cache.set(1, 1);
        cache.set(2, 2);
        expect(cache.has(1)).to.be.false;
        await sleep(48);
        expect(cache.has(1)).to.be.false;
        expect([...cache.keys()]).to.not.include(1);
        expect(cache.size).to.be.at.most(1);
    });

    it('dispose failure does not reject', () => {
        let errs = [];
        let cache = lru({
            max: 1,
            onDispose: () => {
                throw new Error('rejected');
            },
            onError: err => {
                errs.push(err.message);
            }
        });
        cache.set(1, 1);
        cache.set(2, 2);
        expect(errs).to.eql(['rejected']);
        expect(cache.size).to.equal(1);
    });

    it('async dispose failure does not reject', async () => {
        let errs = [];
        let cache = lru({
            max: 1,
            onDispose: async () => {
                throw new Error('rejected');
            },
            onError: err => {
                errs.push(err.message);
            }
        });
        cache.set(1, 1);
        cache.set(2, 2);
        await sleep(8);
        expect(errs).to.eql(['rejected']);
        expect(cache.size).to.equal(1);
    });

    it('has', () => {
        let advance = clock();
        let cache = lru({ ttl: 16 });
        cache.set(1, 1);
        expect(cache.has(1)).to.be.true;
        expect(cache.has(2)).to.be.false;
        advance(24);
        expect(cache.has(1)).to.be.true;
        expect(cache.isExpired(1)).to.be.true;
        let fresh = lru({ ttl: 16, stale: false });
        fresh.set(1, 1);
        advance(24);
        expect(fresh.has(1)).to.be.false;
    });

    it('peek', () => {
        let advance = clock();
        let cache = lru({ max: 2, ttl: 32 });
        cache.set(1, 1);
        cache.set(2, 2);
        expect(cache.peek(1)).to.equal(1);
        expect(cache.peek(3)).to.be.undefined;
        cache.set(3, 3);
        expect(cache.has(1)).to.be.false;
        let stale = lru({ ttl: 16 });
        stale.set(1, 1);
        advance(24);
        expect(stale.peek(1)).to.equal(1);
        expect(stale.size).to.equal(1);
    });

    it('expires', () => {
        let advance = clock();
        let none = lru();
        none.set(1, 1);
        expect(none.expires(1)).to.equal(Infinity);
        expect(none.expires(2)).to.be.undefined;
        let cache = lru({ ttl: 32 });
        cache.set(1, 1);
        expect(cache.expires(1)).to.be.above(0).and.at.most(32);
        advance(40);
        expect(cache.expires(1)).to.equal(0);
    });

    it('delete', () => {
        let cache = lru({ ttl: 32, active: true });
        cache.set(1, 1);
        expect(cache.delete(1)).to.be.true;
        expect(cache.delete(1)).to.be.false;
        expect(cache.size).to.equal(0);
    });

    it('clear', () => {
        let cache = lru({ ttl: 32, active: true });
        cache.set(1, 1);
        cache.set(2, 2);
        cache.clear();
        expect(cache.size).to.equal(0);
        expect(cache.has(1)).to.be.false;
    });

    it('iterates', () => {
        let cache = lru();
        cache.set(1, 'a');
        cache.set(2, 'b');
        expect([...cache]).to.eql([[1, 'a'], [2, 'b']]);
        expect([...cache.entries()]).to.eql([[1, 'a'], [2, 'b']]);
        expect([...cache.keys()]).to.eql([1, 2]);
        expect([...cache.values()]).to.eql(['a', 'b']);
        expect(cache.size).to.equal(2);
        expect(new Map(cache).get(1)).to.equal('a');
    });

    it('iterates with lib methods', () => {
        let cache = lru();
        cache.set(1, 'a');
        cache.set(2, 'b');
        let pairs = [];
        each(cache, (val, key) => {
            pairs.push([key, val]);
        });
        expect(pairs).to.eql([[1, 'a'], [2, 'b']]);
        expect(map(cache, val => val + val)).to.eql(['aa', 'bb']);
    });

    it('iterates expired records when stale', () => {
        let advance = clock();
        let cache = lru({ ttl: 16 });
        cache.set(1, 'a');
        advance(24);
        cache.set(2, 'b');
        expect([...cache.keys()]).to.eql([1, 2]);
        let fresh = lru({ ttl: 16, stale: false });
        fresh.set(1, 'a');
        advance(24);
        fresh.set(2, 'b');
        expect([...fresh.keys()]).to.eql([2]);
    });

});
