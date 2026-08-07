// Round to arbitrary decimal place (without converting to string)
// Returns number
// Note: Prevents FP scale-and-round failures (Math.round, toFixed)
// Note: Supports negative numbers
// Note: FP-safe rounding while the scaled value (num * 10^dec) stays below ~2^51 (2.25e15)
// Above that, fall back to Math.round
// Note: Higher dec lowers the safe num ceiling (~3.32 bits per decimal place)
export function round (num, dec=0) {
    let x = Math.pow(10, dec);
    let y = num * x;
    if (!Number.isFinite(y)) {
        return num;
    }
    // Note: Epsilon nudge only compensates FP error while under (y < 2^51), fall back
    if (Math.abs(y) >= 2 ** 51) {
        return Math.round(y) / x;
    }
    return Math.round(y * (1 + Number.EPSILON)) / x;
}
