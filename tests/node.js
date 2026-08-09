import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { execPath } from 'node:process';
import { env, optsFromArgv, parseArgv, readFiles, readFilesSync } from '../lib/node.js';
import { createArgv } from '../lib/argv.js';
import { createEnv } from '../lib/env.js';

describe('Node', () => {

    it('parseArgv', () => {
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
                'someDir': '/tmp'
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
        expect(parseArgv('--tmp-dir /tmp', { camel: false })).to.eql({
            _: [],
            'tmp-dir': '/tmp'
        });
        expect(parseArgv([execPath, '--test'])).to.eql({
            _:[execPath],
            test: true
        });
        expect(parseArgv([execPath, '--test'], { normalize: true })).to.eql({
            _:[],
            test: true
        });
    });

    it('parseArgv options', () => {
        // Argv can be passed inside the options object
        expect(parseArgv({ argv: ['-a', '1', '--b', 'two'] })).to.eql({
            _: [],
            a: 1,
            b: 'two'
        });
        // Normalize strips a leading absolute path
        expect(parseArgv(['/app/cli.js', '-a', '1'], { normalize: 1 })).to.eql({
            _: [],
            a: 1
        });
        // Normalize keeps a relative leading arg
        expect(parseArgv(['cli.js', '-a', '1'], { normalize: 1 })).to.eql({
            _: ['cli.js'],
            a: 1
        });
    });

    it('createArgv', () => {
        // Default argv is sliced like a process argv list ([argv0, path, ...])
        let { parseArgv } = createArgv(['argv0', 'cli.js', '-a', '1'], { camel: 0 });
        expect(parseArgv()).to.eql({ _: [], a: 1 });
        // Factory-level defaults apply (camel casing off)
        expect(parseArgv(['--my-flag'])).to.eql({ _: [], 'my-flag': true });
        // Per-call options override factory defaults
        expect(parseArgv(['--my-flag'], { camel: 1 })).to.eql({ _: [], myFlag: true });
    });

    it('env', () => {
        expect(env('TEST1')).to.be.undefined;
        env('TEST2', 100);
        expect(env('TEST2')).to.equal(100);
        env('TEST3', null);
        expect(env('TEST3')).to.be.null;
        env('TEST3', undefined);
        expect(env('TEST3')).to.be.undefined;
        env('TEST3', 100);
        expect(env('TEST3')).to.equal(100);
    });

    it('env assign', () => {
        env('ASG1', 'x');
        // Bulk set only fills unset keys
        env({ ASG1: 'y', ASG2: 'z' });
        expect(env('ASG1')).to.equal('x');
        expect(env('ASG2')).to.equal('z');
        // Bulk set with override replaces existing keys
        env({ ASG1: 'y' }, { override: true });
        expect(env('ASG1')).to.equal('y');
    });

    it('env override', () => {
        env('OVR1', 'a');
        expect(env('OVR1')).to.equal('a');
        // Without override an existing value is kept
        env('OVR1', 'b');
        expect(env('OVR1')).to.equal('a');
        // Override replaces the existing value
        env('OVR1', 'b', { override: true });
        expect(env('OVR1')).to.equal('b');
    });

    it('createEnv', () => {
        let store = {};
        let get = key => key === undefined ? store : store[key];
        let set = (key, val) => store[key] = String(val);
        // Factory-level override default applies to every call
        let env = createEnv(get, set, { override: true });
        env('A', 1);
        expect(env('A')).to.equal(1);
        env('A', 2);
        expect(env('A')).to.equal(2);
        // Per-call option overrides the factory default
        env('A', 3, { override: false });
        expect(env('A')).to.equal(2);
        // No-arg call returns the whole store
        expect(env()).to.eql({ A: '2' });
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

    it('readFiles', async () => {
        let [pkg] = await readFiles('./package.json');
        expect(pkg).to.exist;
        expect(pkg.data).to.be.a.string;
        expect(pkg.path).to.equal(resolve('./package.json'));
    });

    it('readFilesSync', () => {
        let [pkg] = readFilesSync('./package.json');
        expect(pkg).to.exist;
        expect(pkg.data).to.be.a.string;
        expect(pkg.path).to.equal(resolve('./package.json'));
    });

});
