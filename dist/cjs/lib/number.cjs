// Round to nearest decimal
// Returns number
// Note: Subject to change or removal
function round (num, dec=0) {
    let x = Math.pow(10, dec);
    return Math.round((num * x) * (1 + Number.EPSILON)) / x;
}

exports.round = round;
