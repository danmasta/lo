describe('Object', () => {

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

});
