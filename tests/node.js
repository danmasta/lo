describe('Node', () => {

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

    it('argv', () => {
        let args = lo.argv('-abc -d=1 -e 1 -f100 --no-g - --test=1 --test 2 one two -- three four --test=fizz= --some-dir=/tmp');
        expect(args).to.eql({
            _pos: ['one', 'two'],
            a: true,
            b: true,
            c: true,
            d: 1,
            e: 1,
            f: 100,
            g: false,
            '-': true,
            test: [1, 2],
            _sub: {
                _pos: ['three', 'four'],
                test: 'fizz=',
                someDir: '/tmp'
            }
        });
    });

    it('optsFromArgv', () => {
        let args = '-e true -d false --enabled false --test 100 -';
        let opts = {
            enabled: 'e',
            disabled: 'd',
            test: undefined,
            stdin: '-',
            dir: null
        }
        expect(lo.optsFromArgv(opts, { args })).to.eql({
            enabled: true,
            disabled: false,
            test: 100,
            stdin: true,
            dir: undefined
        });
    });

});
