import { setTimeout } from 'node:timers/promises';
import { epoch, mono } from '../lib/time.js';

describe('Time', () => {

    it('epoch', async () => {
        // Types
        expect(epoch.now()).to.be.a('number');
        expect(epoch.ms()).to.be.a('number');
        expect(epoch.s()).to.be.a('number');
        expect(epoch.us()).to.be.a('number');
        expect(epoch.ns()).to.be.a('bigint');
        // Truncate to integers
        expect(Number.isInteger(epoch.ms())).to.be.true;
        expect(Number.isInteger(epoch.s())).to.be.true;
        expect(Number.isInteger(epoch.us())).to.be.true;
        // Tracks wall-time
        expect(Math.abs(epoch.ms() - Date.now())).to.be.below(100);
        // BigInt doesn't throw (ns)
        expect(() => epoch.ns()).to.not.throw();
        // Monotonic
        let prev = epoch.ns();
        await setTimeout(5);
        expect(epoch.ns() >= prev).to.be.true;
        // Units consistent
        expect(Math.abs(epoch.s() - Math.trunc(epoch.ms() / 1_000))).to.be.at.most(1);
        expect(Math.abs(Number(epoch.us()) / 1_000 - epoch.ms())).to.be.below(100);
        // Agree to the microsecond (ns and us)
        let t = BigInt(epoch.us()) - epoch.ns() / 1_000n;
        expect(t >= -1_000_000n && t <= 1_000_000n).to.be.true;
    });

    it('mono', async () => {
        // Types
        expect(mono.now()).to.be.a('number');
        expect(mono.ms()).to.be.a('number');
        expect(mono.s()).to.be.a('number');
        expect(mono.us()).to.be.a('number');
        expect(mono.ns()).to.be.a('bigint');
        // Truncate to integers
        expect(Number.isInteger(mono.ms())).to.be.true;
        expect(Number.isInteger(mono.s())).to.be.true;
        expect(Number.isInteger(mono.us())).to.be.true;
        // BigInt doesn't throw (ns)
        expect(() => mono.ns()).to.not.throw();
        // Monotonic
        let a = mono.ns();
        await setTimeout(5);
        let b = mono.ns();
        expect(b > a).to.be.true;
        // Smaller than epoch (uptime vs wall-clock)
        expect(mono.ms()).to.be.below(epoch.ms());
        // Relationship (epoch.ns() = epoch.origin + mono.ns())
        let e = epoch.ns();
        let m = mono.ns();
        let diff = e - m - epoch.origin;
        // Within 1ms
        expect(diff >= -1_000_000n && diff <= 1_000_000n).to.be.true;
    });

});
