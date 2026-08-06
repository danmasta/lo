// Time since epoch (monotonic)
export const epoch = {

    // High resolution origin for ns
    // Note: Safe until year ~2255 (wall-clock)
    origin: BigInt(Math.trunc(performance.timeOrigin * 1_000)) * 1_000n,

    // Milliseconds with microsecond precision
    // Note: Fixed ~244 ns of resolution
    now () {
        return performance.timeOrigin + performance.now();
    },

    // Milliseconds
    // Note: Safe forever
    ms () {
        return Math.trunc(this.now());
    },

    // Seconds
    // Note: Safe forever
    s () {
        return Math.trunc(this.now() / 1_000);
    },

    // Microseconds
    // Note: Safe until year ~2255 (wall-clock)
    us () {
        return Math.trunc(this.now() * 1_000);
    },

    // Nanoseconds, returns BigInt
    // Note: Timings are quantized down in browsers (lower precision)
    // Note: Need to split fractional ms so *1e6 doesn't overflow MAX_SAFE_INTEGER (~104 days)
    // Note: Safe for ~285,000 years of uptime
    // Note: Convert to float via Number(epoch.ns()) (~256 ns resolution, lossy)
    ns () {
        return this.origin + mono.ns();
    }

};

// Monotonic time
export const mono = {

    // Milliseconds with microsecond precision
    // Note: Resolution coarsens with uptime (1.9 ns at 104 days, 3.8 ns at 1 year)
    now () {
        return performance.now();
    },

    // Milliseconds
    // Note: Safe forever
    ms () {
        return Math.trunc(this.now());
    },

    // Seconds
    // Note: Safe forever
    s () {
        return Math.trunc(this.now() / 1_000);
    },

    // Microseconds
    // Note: Safe for ~286 years of uptime
    us () {
        return Math.trunc(this.now() * 1_000);
    },

    // Nanoseconds, returns BigInt
    // Note: Timings are quantized down in browsers (lower precision)
    // Note: Need to split fractional ms so *1e6 doesn't overflow MAX_SAFE_INTEGER (~104 days)
    // Note: Safe for ~285,000 years of uptime
    // Note: Convert to float via Number(mono.ns()) (~256 ns resolution, lossy)
    ns () {
        let t = performance.now();
        let ms = Math.trunc(t);
        return BigInt(ms) * 1_000_000n + BigInt(Math.trunc((t - ms) * 1_000_000));
    }

};
