import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { optsFromArgv, parseArgv } from '../lib/argv.js';

describe('Node', () => {

    it('argv', () => {
        let argv = parseArgv('-abc -d=1 -e 1 -f100 --no-g - --test=1 --test 2 one two -- three four --test=fizz= --some-dir=/tmp');
        expect(argv).to.eql({
            _: ['one', 'two'],
            a: true,
            b: true,
            c: true,
            d: 1,
            e: 1,
            f: 100,
            g: false,
            '-': true,
            test: [1, 2],
            sub: {
                _: ['three', 'four'],
                test: 'fizz=',
                'some-dir': '/tmp'
            }
        });
        expect(parseArgv(`--test="space str" --param="test str"`)).to.eql({
            _: [],
            test: 'space str',
            param: 'test str'
        });
        expect(parseArgv(`-t 'space str' -p='test str'`)).to.eql({
            _: [],
            t: 'space str',
            p: 'test str'
        });
        // Note: mixing case isn't supported
        expect(parseArgv(`-t "space str" -p='test str'`)).to.eql({
            _: ["str'"],
            t: 'space str',
            p: "'test"
        });
    });

    it('env', () => {
        expect(lo.env('TEST1')).to.be.undefined;
        lo.env('TEST2', 100);
        expect(lo.env('TEST2')).to.equal(100);
        lo.env('TEST3', null);
        expect(lo.env('TEST3')).to.be.null;
        lo.env('TEST3', undefined);
        expect(lo.env('TEST3')).to.be.undefined;
        lo.env('TEST3', 100);
        expect(lo.env('TEST3')).to.equal(100);
    });

    it('optsFromArgv', () => {
        let argv = '-e true -d false --enabled false --test 100 -';
        let opts = {
            enabled: 'e',
            disabled: 'd',
            test: undefined,
            stdin: '-',
            dir: null
        };
        expect(optsFromArgv(opts, { argv })).to.eql({
            enabled: true,
            disabled: false,
            test: 100,
            stdin: true,
            dir: undefined
        });
    });

    it('resolve', () => {
        expect(lo.resolve('~')).to.equal(homedir());
        expect(lo.resolve('./package.json')).to.equal(resolve('./package.json'));
        expect(lo.resolve('./_setup.js', './lib')).to.equal(resolve('./lib/_setup.js'));
    });

    it('resolveIfExists', async () => {
        let pkg = resolve('./package.json');
        expect(await lo.resolveIfExists('./package.json')).to.equal(pkg);
        expect(await lo.resolveIfExists('./package', { exts: '.json' })).to.equal(pkg);
        expect(await lo.resolveIfExists('./package', { require: true })).to.equal(pkg);
    });

    it('resolveIfExistsSync', () => {
        let pkg = resolve('./package.json');
        expect(lo.resolveIfExistsSync('./package.json')).to.equal(pkg);
        expect(lo.resolveIfExistsSync('./package', { exts: '.json' })).to.equal(pkg);
        expect(lo.resolveIfExistsSync('./package', { require: true })).to.equal(pkg);
    });

});
