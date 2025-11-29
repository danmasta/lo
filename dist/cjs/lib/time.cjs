// Time since epoch in seconds
function epochS () {
    return Math.trunc(epochMs() / 1000);
}

// Time since epoch in milliseconds
function epochMs () {
    return Date.now();
}

// Time since epoch in microseconds
function epochUs () {
    return epochMs() * 1000;
}

// Time since epoch in nanoseconds, returns BigInt
function epochNs () {
    return BigInt(epochMs() * 1000000);
}

// Monotonic time in seconds
function monoS () {
    return monoMs() / 1000;
}

// Monotonic time in milliseconds with microsecond precision
function monoMs () {
    return performance.now();
}

// Monotonic time in microseconds
function monoUs () {
    return monoMs() * 1000;
}

// Monotonic time in nanoseconds, returns BigInt
function monoNs () {
    return BigInt(Math.trunc(monoMs() * 1000000));
}

exports.epoch = epochMs;
exports.epochMs = epochMs;
exports.epochNs = epochNs;
exports.epochS = epochS;
exports.epochUs = epochUs;
exports.mono = monoMs;
exports.monoMs = monoMs;
exports.monoNs = monoNs;
exports.monoS = monoS;
exports.monoUs = monoUs;
