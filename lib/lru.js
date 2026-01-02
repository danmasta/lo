import { SYMBOLS } from './constants.js';
import { each } from './iterate.js';
import { mono } from './time.js';
import { isAsyncFunction } from './types.js';
import { defaults } from './util.js';

const defs = {
    max: 1024,
    ttl: undefined,
    stale: true,
    dispose: undefined,
    refresh: undefined,
    active: false
};

// Simple LRU cache that supports space and time expiry
// Supports both active and passive ttl
// dispose = Fn called when record evicted due to space
// refresh = Fn called when record expired due to time
// Note: If refresh is defined, the returned value is re-added to the cache
// unless BREAK is returned
export class LRU {

    constructor (opts) {
        let { ttl, refresh } = this.opts = defaults(opts, defs);
        this.cache = new Map();
        this.ttl = ttl && ttl > 0 && ttl !== Infinity ? ttl : 0;
        this.async = isAsyncFunction(refresh);
    }

    get (key) {
        let { cache, ttl, opts: { stale, active }} = this;
        let rec = cache.get(key);
        if (!rec) {
            return;
        }
        let now = mono();
        if (ttl) {
            if (now - rec.time >= ttl) {
                if (!rec.pending) {
                    this.dispose(key, rec, SYMBOLS.expired);
                }
                if (stale) {
                    return rec.val;
                }
                return undefined;
            } else {
                if (active) {
                    this.refreshTimer(key, rec, ttl);
                }
            }
        }
        rec.time = now;
        cache.delete(key);
        cache.set(key, rec);
        return rec.val;
    }

    set (key, val) {
        let { cache, ttl, opts: { max, active }} = this;
        if (cache.has(key)) {
            cache.delete(key);
        }
        let rec = { val, time: mono() };
        if (ttl && active) {
            this.refreshTimer(key, rec, ttl);
        }
        cache.set(key, rec);
        while (cache.size > max) {
            let head = this.head();
            if (!head.done) {
                this.dispose(...head.value, SYMBOLS.evicted);
            }
        }
        return this;
    }

    has (key) {
        return this.cache.has(key);
    }

    delete (key) {
        let { cache, ttl, opts: { active }} = this;
        if (ttl && active) {
            let rec = cache.get(key);
            if (rec) {
                clearTimeout(rec.timer);
            }
        }
        return cache.delete(key);
    }

    clear () {
        let { cache, ttl, opts: { active }} = this;
        if (ttl && active) {
            each(cache, rec => {
                clearTimeout(rec.timer);
            });
        }
        return cache.clear();
    }

    async dispose (key, rec, event) {
        let { cache, async, opts: { dispose, refresh }} = this;
        switch (event) {
            case SYMBOLS.evicted:
                if (rec.timer) {
                    clearTimeout(rec.timer);
                }
                cache.delete(key);
                if (dispose) {
                    dispose(key, rec.val, this);
                }
                break;
            case SYMBOLS.expired:
                if (refresh) {
                    let res = refresh(key, rec.val, this);
                    if (async) {
                        rec.pending = true;
                        res = await res;
                    }
                    cache.delete(key);
                    if (res !== SYMBOLS.break) {
                        this.set(key, res);
                    }
                } else {
                    cache.delete(key);
                }
                break;
            default:
                cache.delete(key);
                break;
        }
    }

    refreshTimer (key, rec, ttl=this.ttl) {
        if (rec.timer) {
            clearTimeout(rec.timer);
        }
        rec.timer = setTimeout(() => {
            this.dispose(key, rec, SYMBOLS.expired);
        }, ttl);
        rec.timer.unref?.();
    }

    entries () {
        return this.cache.entries();
    }

    head () {
        return this.cache.entries().next();
    }

    isExpired (key) {
        let rec = this.cache.get(key);
        if (!rec || !this.ttl) {
            return false;
        }
        return mono() - rec.time >= this.ttl;
    }

    isFull () {
        return this.cache.size >= this.opts.max;
    }

    static factory (defs) {
        return function factory (opts) {
            return new LRU({ ...defs, ...opts });
        }
    }

};

export const lru = LRU.factory();
