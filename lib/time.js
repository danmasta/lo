// Time since epoch in seconds
export function epochS () {
    return Math.trunc(epochMs() / 1000);
}

// Time since epoch in milliseconds
export function epochMs () {
    return Date.now();
}

// Time since epoch in microseconds
export function epochUs () {
    return epochMs() * 1000;
}

// Time since epoch in nanoseconds, returns BigInt
export function epochNs () {
    return BigInt(epochMs() * 1000000);
}

// Monotonic time in seconds
export function monoS () {
    return monoMs() / 1000;
}

// Monotonic time in milliseconds with microsecond precision
export function monoMs () {
    return performance.now();
}

// Monotonic time in microseconds
export function monoUs () {
    return monoMs() * 1000;
}

// Monotonic time in nanoseconds, returns BigInt
export function monoNs () {
    return BigInt(Math.trunc(monoMs() * 1000000));
}

export {
    epochMs as epoch,
    monoMs as mono
}
