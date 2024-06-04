.PHONY: test coverage clean build watch status

test:
	node_modules/.bin/mocha tests

coverage:
	node_modules/.bin/c8 --reporter=lcov node_modules/.bin/mocha tests

clean:
	@rm -rf dist/*

build: clean
	node_modules/.bin/rollup -c

watch: clean
	node_modules/.bin/rollup -c -w

status:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Git tree not clean"; \
		exit 1; \
	fi
