import { addType, SYMBOLS } from './constants.js';
import { mono } from './time.js';
import { defaults } from './util.js';

const defs = {
    max: 1024,
    ttl: undefined,
    idle: undefined,
    stale: true,
    refresh: undefined,
    weigh: undefined,
    fetch: undefined,
    onDispose: undefined,
    onError: undefined,
    active: false
};

// Normalize duration to positive finite number or 0 (disabled)
function ms (num) {
    return num > 0 && num !== Infinity ? +num : 0;
}

// Simple LRU cache
// Features: Space expiry, time expiry (absolute and sliding deadlines, active or
// passive), stale reads, refresh with backoff, dispose and error hooks, peek, and
// iteration protocol
// max = Maximum records to hold (0 to disable, Infinity for unbounded)
// ttl = Absolute time expiry in ms (measured from insert time)
// idle = Sliding time expiry in ms (measured from last access)
// Note: ttl and idle can be combined (the earlier deadline wins)
// stale = Whether to serve expired records while being replaced
// refresh = Fn called when record expired due to time
// onDispose = Fn called when record evicted due to space
// onError = Fn called when a dispose or refresh callback throws
// active = Whether to actively expire unread records on a timer
// Note: Setting active=true scales the sweep gap automatically based on cache size (recommended)
// Note: Setting active=number explicitly sets the minimum gap time
// Note: Single timer serves the whole cache
// Note: Reads trigger expiry in both passive and active modes
// Note: If refresh is defined, the returned value is re-added to the cache,
// unless BREAK is returned
export class LRU {

    // Shortest gap between sweeps in ms
    static FLOOR = 128;

    // Grow the sweep gap by cache size (size / SCALE ms)
    static SCALE = 1024;

    constructor (opts) {
        let { max, ttl, idle, stale, refresh, onDispose, onError, active } = defaults(opts, defs);
        this.cache = new Map();
        // Note: Unlike durations, Infinity=unbounded
        this.max = max > 0 ? +max : 0;
        this.ttl = ms(ttl);
        this.idle = ms(idle);
        this.stale = !!stale;
        this.refresh = refresh;
        this.onDispose = onDispose;
        this.onError = onError;
        this.active = !!active;
        // Note: 0=automatic, number=explicit
        this.floor = active === true ? 0 : ms(active);
        this.timer = undefined;
        this.deadline = 0;
    }

    // Time left before rec expires in ms (0=expired, Infinity=no expiry configured)
    // Note: Earliest of hard (ttl) and sliding (idle) deadline wins
    remaining (rec, now=mono.ms()) {
        let { ttl, idle } = this;
        let rem = Infinity;
        if (ttl) {
            rem = ttl - (now - rec.time);
        }
        if (idle) {
            rem = Math.min(rem, idle - (now - rec.hit));
        }
        return rem > 0 ? rem : 0;
    }

    // Whether a record can still be read (live or stale)
    readable (rec, now) {
        return !!this.remaining(rec, now) || this.stale;
    }

    get (key) {
        let { cache, stale } = this;
        let rec = cache.get(key);
        if (!rec) {
            return;
        }
        let now = mono.ms();
        if (!this.remaining(rec, now)) {
            if (!rec.pending && !(rec.retry > now)) {
                this.dispose(key, rec, SYMBOLS.expired);
            }
            return stale ? rec.val : undefined;
        }
        rec.hit = now;
        cache.delete(key);
        cache.set(key, rec);
        return rec.val;
    }

    set (key, val) {
        let { cache, max, active, onDispose } = this;
        if (cache.has(key)) {
            cache.delete(key);
        }
        let now = mono.ms();
        let rec = { val, time: now, hit: now };
        cache.set(key, rec);
        if (active) {
            this.arm(this.remaining(rec, now), now);
        }
        // Note: Evict oldest entries if over capacity (deletes inline if possible)
        while (cache.size > max) {
            let head = this.head();
            if (head.done) {
                break;
            }
            if (onDispose) {
                this.dispose(...head.value, SYMBOLS.evicted);
            } else {
                cache.delete(head.value[0]);
            }
        }
        return this;
    }

    // Get a record without updating recency, timer, or triggering expiry
    peek (key) {
        let { cache } = this;
        let rec = cache.get(key);
        if (rec && this.readable(rec)) {
            return rec.val;
        }
    }

    // Whether get would return a value for key (honors stale)
    // Note: Use isExpired to check freshness
    has (key) {
        let rec = this.cache.get(key);
        return !!rec && this.readable(rec);
    }

    delete (key) {
        return this.cache.delete(key);
    }

    clear () {
        this.disarm();
        return this.cache.clear();
    }

    // Note: Only async so refresh, onDispose can be awaited (callers do not await)
    // Note: Should never reject
    // Note: Refresh is always async. Reads are served stale until it completes,
    // and redundant dispose is skipped while pending
    async dispose (key, rec, event) {
        let { cache, refresh, onDispose, onError } = this;
        try {
            if (event === SYMBOLS.expired && refresh) {
                rec.pending = true;
                let res = await refresh(key, rec.val, this);
                rec.pending = false;
                // Note: Verify rec still exists (could be replaced, deleted, or cleared while refresh runs)
                if (cache.get(key) !== rec) {
                    return;
                }
                cache.delete(key);
                if (res !== SYMBOLS.break) {
                    this.set(key, res);
                }
            } else {
                cache.delete(key);
                if (event === SYMBOLS.evicted && onDispose) {
                    await onDispose(key, rec.val, this);
                }
            }
        } catch (err) {
            this.settle(key, rec);
            if (onError) {
                onError(err, key, event, this);
            }
        }
    }

    // Settle a record after a failing callback: keep serving it when stale, else
    // drop it since it can no longer be read
    // Note: Clear pending first, a stuck flag freezes the record (get and sweep will skip it)
    // Note: Skip evicted or replaced records
    settle (key, rec) {
        let { cache, stale, ttl, idle, active } = this;
        rec.pending = false;
        if (cache.get(key) !== rec) {
            return;
        }
        if (!stale) {
            cache.delete(key);
            return;
        }
        // Note: Back off a full interval so failing callbacks don't fire on every read
        let backoff = ttl || idle;
        rec.retry = mono.ms() + backoff;
        if (active) {
            this.arm(backoff);
        }
    }

    // Evict all expired records and find the next deadline
    // Note: Single timer for the whole cache
    sweep () {
        let now = mono.ms();
        let next = Infinity;
        this.timer = undefined;
        for (const [key, rec] of this.cache) {
            if (rec.pending) {
                // Refresh is in flight (triggers arm already)
                continue;
            }
            let rem = this.remaining(rec, now);
            if (rec.retry > now) {
                // Held in backoff by a failing callback (retries on the next sweep)
                rem = rec.retry - now;
            } else if (!rem) {
                this.dispose(key, rec, SYMBOLS.expired);
                continue;
            }
            if (rem < next) {
                next = rem;
            }
        }
        this.arm(next, now);
    }

    // Minimum time between sweeps in ms
    // Note: A sweep is O(n) (~1ms per 100k records), so scaling the gap with size
    // pins CPU load near 1% of a core at any size, instead of sweeping every
    // FLOOR ms and hammering the CPU
    gap () {
        return this.floor || Math.max(LRU.FLOOR, this.cache.size / LRU.SCALE);
    }

    // Arm the timer for the next deadline (unless one is due sooner)
    // Note: Floored so staggered expiries batch into one pass
    arm (delay, now=mono.ms()) {
        let { timer } = this;
        if (delay === Infinity) {
            return;
        }
        let floor = this.gap();
        if (delay < floor) {
            delay = floor;
        }
        let deadline = now + delay;
        if (timer && this.deadline <= deadline) {
            return;
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
            this.sweep();
        }, delay);
        timer.unref?.();
        this.timer = timer;
        this.deadline = deadline;
    }

    disarm () {
        clearTimeout(this.timer);
        this.timer = undefined;
    }

    // Note: Yields values, not records
    * entries () {
        let now = mono.ms();
        for (const [key, rec] of this.cache) {
            if (this.readable(rec, now)) {
                yield [key, rec.val];
            }
        }
    }

    * keys () {
        for (const [key] of this.entries()) {
            yield key;
        }
    }

    * values () {
        for (const [, val] of this.entries()) {
            yield val;
        }
    }

    [Symbol.iterator] () {
        return this.entries();
    }

    // Count of records held
    // Note: Can exceed what iteration would yield, when stale is disabled and
    // expired records have not yet been evicted
    get size () {
        return this.cache.size;
    }

    head () {
        return this.cache.entries().next();
    }

    // Time left until key expires in ms (undefined if no record)
    expires (key) {
        let rec = this.cache.get(key);
        if (rec) {
            return this.remaining(rec);
        }
    }

    isExpired (key) {
        let rec = this.cache.get(key);
        return !!rec && !this.remaining(rec);
    }

    isFull () {
        return this.cache.size >= this.max;
    }

    static factory (defs) {
        return function factory (opts) {
            return new LRU({ ...defs, ...opts });
        }
    }

};

// Note: Register type
addType({ n: 'LRU', c: LRU, x: [1, 0, 2, 1] });

export const lru = LRU.factory();
