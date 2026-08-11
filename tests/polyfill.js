import { createRequire as nodeCreateRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath as nodeFileURLToPath } from 'node:url';
import { createRequire } from '../polyfill/base/module.js';
import { posix, relative, resolve, win32 } from '../polyfill/base/path.js';
import { fileURLToPath } from '../polyfill/base/url.js';

describe('Polyfill', () => {

    it('path resolve', () => {
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

    it('url fileURLToPath', () => {
        // Matches node for file:// URLs
        assert.equal(fileURLToPath('file:///a/b/c.js'), nodeFileURLToPath('file:///a/b/c.js'));
        // URI-encoded chars are decoded
        assert.equal(fileURLToPath('file:///a/b%20c.js'), nodeFileURLToPath('file:///a/b%20c.js'));
        // Non file:// input is returned unchanged
        assert.equal(fileURLToPath('/a/b/c.js'), '/a/b/c.js');
        assert.equal(fileURLToPath('./a/b'), './a/b');
    });

    it('module createRequire resolve', () => {
        const cwd = process.cwd();
        // Default resolves from cwd
        assert.equal(createRequire().resolve('./a/b'), path.resolve(cwd, './a/b'));
        // Filename resolves from its parent directory (like node)
        assert.equal(createRequire('/foo/bar/mod.js').resolve('./x'), path.resolve('/foo/bar', './x'));
        // File URL resolves from its parent directory
        assert.equal(createRequire('file:///foo/bar/mod.js').resolve('./x'), path.resolve('/foo/bar', './x'));
        // Directory (trailing sep) resolves from that directory
        assert.equal(createRequire('/foo/bar/').resolve('./x'), path.resolve('/foo/bar', './x'));
        // require and require.resolve have the same resolution
        const req = createRequire('/foo/bar/mod.js');
        assert.equal(req.resolve('./x'), req.resolve('./x'));
        // Supports import.meta.url correctly
        assert.equal(
            createRequire(import.meta.url).resolve('./_setup.js'),
            nodeCreateRequire(import.meta.url).resolve('./_setup.js')
        );
    });

    it('module require caches and evicts', async () => {
        const req = createRequire();
        // Repeat calls return the same cached promise
        const p1 = req('./polyfill/base/url.js');
        const p2 = req('./polyfill/base/url.js');
        assert.equal(p1, p2);
        // Promise resolves to the imported module namespace
        const mod = await p1;
        assert.equal(typeof mod.fileURLToPath, 'function');
        // Rejected import is evicted for retry
        const missing = './does-not-exist.mjs';
        await req(missing).then(() => assert.fail('should reject'), () => {});
        assert.equal(req.cache.has(req.resolve(missing)), false);
    });

});
