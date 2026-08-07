import { round } from '../lib/number.js';

describe('Number', () => {

    it('round', () => {
        // Return number
        expect(round(1.234, 2)).to.be.a('number');
        // Basic rounding to decimal places
        expect(round(1.234, 2)).to.equal(1.23);
        expect(round(1.236, 2)).to.equal(1.24);
        expect(round(1.5, 0)).to.equal(2);
        // Default to 0 decimal places
        expect(round(1.4)).to.equal(1);
        expect(round(1.6)).to.equal(2);
        // Fix FP scale-and-round failures (Math.round, toFixed)
        expect(round(1.005, 2)).to.equal(1.01);
        expect(round(2.005, 2)).to.equal(2.01);
        expect(round(8.575, 2)).to.equal(8.58);
        expect(round(35.855, 2)).to.equal(35.86);
        expect(round(1.255, 2)).to.equal(1.26);
        // Negative numbers (symmetric away from zero)
        expect(round(-1.005, 2)).to.equal(-1.01);
        expect(round(-0.5, 0)).to.equal(-1);
        // Negative dec rounds to tens/hundreds
        expect(round(1234.5678, -2)).to.equal(1200);
        // Non-finite passes through unchanged
        expect(Number.isNaN(round(NaN, 2))).to.be.true;
        expect(round(Infinity, 2)).to.equal(Infinity);
        expect(round(-Infinity, 2)).to.equal(-Infinity);
        // Large magnitude (no corruption, fall back to Math.round past 2^51)
        expect(round(1e20, 2)).to.equal(1e20);
        expect(round(5e13, 2)).to.equal(5e13);
        // No spurious +1 bump
        expect(round(2 ** 51, 0)).to.equal(2 ** 51);
        // Integer no-op
        expect(round(2 ** 52 + 1, 0)).to.equal(2 ** 52 + 1);
    });

});
