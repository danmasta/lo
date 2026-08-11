import path from 'node:path';
import { posix, relative, resolve, win32 } from '../polyfill/base/path.js';

describe('Polyfill', () => {

    it('path', () => {
        assert.equal(resolve(), path.resolve());
        assert.equal(resolve('.'), path.resolve('.'));
        assert.equal(resolve('..'), path.resolve('..'));
        assert.equal(resolve('./package.json'), path.resolve('./package.json'));
    });

    it('path relative', () => {
        assert.equal(relative('/a/b/c', '/a/b/d'), path.posix.relative('/a/b/c', '/a/b/d'));
        assert.equal(relative('/a/b/c', '/a/b/c'), path.posix.relative('/a/b/c', '/a/b/c'));
        assert.equal(relative('/a/b', '/a/b/c/d'), path.posix.relative('/a/b', '/a/b/c/d'));
        assert.equal(relative('/a/b/c/d', '/a/b'), path.posix.relative('/a/b/c/d', '/a/b'));
        assert.equal(relative('/a/b/c', '/x/y/z'), path.posix.relative('/a/b/c', '/x/y/z'));
        assert.equal(relative('a/b/c', 'a/b/d'), path.posix.relative('a/b/c', 'a/b/d'));
        assert.equal(relative('./src', './src/lib'), path.posix.relative('./src', './src/lib'));
    });

    it('path posix', () => {
        assert.equal(posix.isAbsolute('/a/b'), path.posix.isAbsolute('/a/b'));
        assert.equal(posix.isAbsolute('a/b'), path.posix.isAbsolute('a/b'));
        assert.equal(posix.normalize('/a/b/../c'), path.posix.normalize('/a/b/../c'));
        assert.equal(posix.normalize('a//b/./c'), path.posix.normalize('a//b/./c'));
        assert.equal(posix.join('a', 'b', '..', 'c'), path.posix.join('a', 'b', '..', 'c'));
        assert.equal(posix.resolve('/a/b', 'c', '../d'), path.posix.resolve('/a/b', 'c', '../d'));
        assert.equal(posix.relative('/a/b/c', '/a/b/d'), path.posix.relative('/a/b/c', '/a/b/d'));
        assert.deepEqual(posix.parse('/a/b/file.txt'), path.posix.parse('/a/b/file.txt'));
        // Backslash is valid filename char on posix
        assert.equal(posix.isAbsolute('\\a'), path.posix.isAbsolute('\\a'));
        // Trailing sep is preserved
        assert.equal(posix.normalize('/foo//bar/'), path.posix.normalize('/foo//bar/'));
        assert.equal(posix.normalize('a/b/'), path.posix.normalize('a/b/'));
        assert.equal(posix.normalize('a/../'), path.posix.normalize('a/../'));
        // dirname / basename / extname
        assert.equal(posix.dirname('/a/b/c.txt'), path.posix.dirname('/a/b/c.txt'));
        assert.equal(posix.basename('/a/b/c.txt'), path.posix.basename('/a/b/c.txt'));
        assert.equal(posix.basename('/a/b/c.txt', '.txt'), path.posix.basename('/a/b/c.txt', '.txt'));
        assert.equal(posix.extname('/a/b/c.txt'), path.posix.extname('/a/b/c.txt'));
        assert.equal(posix.extname('/a/b/c'), path.posix.extname('/a/b/c'));
        // Format round-trips correctly
        assert.equal(posix.format(posix.parse('/a/b/c.txt')), path.posix.format(path.posix.parse('/a/b/c.txt')));
    });

    it('path win32', () => {
        // isAbsolute (drive, UNC, leading sep, drive-relative)
        assert.equal(win32.isAbsolute('C:\\a'), path.win32.isAbsolute('C:\\a'));
        assert.equal(win32.isAbsolute('c:/a'), path.win32.isAbsolute('c:/a'));
        assert.equal(win32.isAbsolute('C:a'), path.win32.isAbsolute('C:a'));
        assert.equal(win32.isAbsolute('\\\\srv\\share'), path.win32.isAbsolute('\\\\srv\\share'));
        assert.equal(win32.isAbsolute('a\\b'), path.win32.isAbsolute('a\\b'));
        // Normalize
        assert.equal(win32.normalize('C:\\a\\..\\b'), path.win32.normalize('C:\\a\\..\\b'));
        // Resolve (absolute inputs)
        assert.equal(win32.resolve('C:\\a\\b', 'c', '..\\d'), path.win32.resolve('C:\\a\\b', 'c', '..\\d'));
        assert.equal(win32.resolve('\\\\wsl$\\Ubuntu\\a', 'b', '..\\c'), path.win32.resolve('\\\\wsl$\\Ubuntu\\a', 'b', '..\\c'));
        // Relative (drive, UNC, different roots)
        assert.equal(win32.relative('C:\\a\\b\\c', 'C:\\a\\b\\d'), path.win32.relative('C:\\a\\b\\c', 'C:\\a\\b\\d'));
        assert.equal(win32.relative('C:\\a', 'D:\\a'), path.win32.relative('C:\\a', 'D:\\a'));
        assert.equal(win32.relative('\\\\a\\b\\c', '\\\\a\\b\\d'), path.win32.relative('\\\\a\\b\\c', '\\\\a\\b\\d'));
        assert.equal(win32.relative('\\\\a\\b\\c', '\\\\x\\y\\z'), path.win32.relative('\\\\a\\b\\c', '\\\\x\\y\\z'));
        // Parse (drive and UNC roots)
        assert.deepEqual(win32.parse('C:\\a\\b\\file.txt'), path.win32.parse('C:\\a\\b\\file.txt'));
        assert.deepEqual(win32.parse('\\\\wsl$\\Ubuntu\\home\\test'), path.win32.parse('\\\\wsl$\\Ubuntu\\home\\test'));
        // Trailing sep preserved
        assert.equal(win32.normalize('C:\\a\\b\\'), path.win32.normalize('C:\\a\\b\\'));
        assert.equal(win32.normalize('C:\\a\\..\\'), path.win32.normalize('C:\\a\\..\\'));
        // Join
        assert.equal(win32.join('C:\\a', 'b', '..', 'c'), path.win32.join('C:\\a', 'b', '..', 'c'));
        // dirname / basename / extname
        assert.equal(win32.dirname('C:\\a\\b\\c.txt'), path.win32.dirname('C:\\a\\b\\c.txt'));
        assert.equal(win32.basename('C:\\a\\b\\c.txt'), path.win32.basename('C:\\a\\b\\c.txt'));
        assert.equal(win32.extname('C:\\a\\b\\c.txt'), path.win32.extname('C:\\a\\b\\c.txt'));
    });

});
