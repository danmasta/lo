describe('Object', () => {

    it('defaults', () => {
        expect(lo.defaults({1:2,2:3}, fx.obj1)).to.eql({1:2});
        expect(lo.defaults({1:null,2:{2:3}}, fx.obj2)).to.eql({1:1,2:{2:3}});
    });

    it('assign', () => {
        expect(lo.assign({ 1: 1 }, { 1: 2 })).to.eql({ 1: 2 });
        expect(lo.assign({ 1: 1 }, { 1: null })).to.eql({ 1: 1 });
        expect(lo.assign({ 1: 1 }, { 1: null }, { 1: 3 })).to.eql({ 1: 3 });
        expect(lo.assign({ 1: null }, { 1: undefined })).to.eql({ 1: null });
        expect(lo.assign({ 1: 1 }, { 1: 2 }, true)).to.eql({ 1: 1 });
        expect(lo.assign({ 1: 1, 2: null }, { 1: 2, 2: 2 }, true)).to.eql({ 1: 1, 2: 2 });
    });

    it('merge', () => {
        expect(lo.merge({ 1: 1 }, { 1: 2 })).to.eql({ 1: 2 });
        expect(lo.merge({ 1: 1 }, { 1: null })).to.eql({ 1: 1 });
        expect(lo.merge({ 1: 1 }, { 1: null }, { 1: 3 })).to.eql({ 1: 3 });
        expect(lo.merge({ 1: null }, { 1: undefined })).to.eql({ 1: null });
        expect(lo.merge({ 1: 1 }, { 1: 2 }, true)).to.eql({ 1: 1 });
        expect(lo.merge({ 1: 1, 2: null }, { 1: 2, 2: 2 }, true)).to.eql({ 1: 1, 2: 2 });
    });

    it('freeze', () => {
        let obj = lo.freeze({1:1,2:{2:2}});
        expect(()=>{ obj[2]=2 }).to.throw(TypeError);
        expect(()=>{ obj[2][2]=3 }).to.throw(TypeError);
    });

    it('has', () => {
        expect(lo.has(fx.obj1, '1')).to.be.true;
        expect(lo.has(fx.obj2, '2.2')).to.be.true;
        expect(lo.has(fx.obj3, '1')).to.be.false;
    });

    it('hasOwn', () => {
        expect(lo.hasOwn(fx.obj3, '3')).to.be.true;
        expect(lo.hasOwn(fx.obj3, '1')).to.be.false;
    });

    it('get', () => {
        expect(lo.get(fx.obj1, '1')).to.equal(1);
        expect(lo.get(fx.obj2, '2.2')).to.equal(2);
        expect(lo.get(fx.obj3, '1')).to.be.undefined;
    });

    it('getOwn', () => {
        expect(lo.getOwn(fx.obj3, '3')).to.equal(3);
        expect(lo.getOwn(fx.obj3, '1')).to.be.undefined;
    });

    it('set', () => {
        let obj = {1:1};
        lo.set(obj, '2', 2);
        lo.set(obj, '3.0', 1);
        lo.set(obj, '4.test', 1);
        expect(obj[2]).to.equal(2);
        expect(obj[3]).to.be.a('array');
        expect(obj[3][0]).to.equal(1);
        expect(obj[4]).to.be.a('object');
        expect(obj[4].test).to.equal(1);
    });

    it('setOwn', () => {
        let obj = {};
        lo.setOwn(obj, '1', 1);
        lo.setOwn(obj, '2.2', 2);
        expect(obj[1]).to.equal(1);
        expect(obj['2.2']).to.equal(2);
        expect(obj[2]).to.be.undefined;
    });

});
