.PHONY: test coverage clean build watch

test:
	node_modules/.bin/mocha tests

coverage:
	node_modules/.bin/nyc --reporter=lcov node_modules/.bin/mocha tests

clean:
	rm -rf dist/*

build: clean
	node_modules/.bin/rollup -c

watch: clean
	node_modules/.bin/rollup -c -w
