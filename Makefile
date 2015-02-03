MOCHA=./node_modules/mocha/bin/_mocha
JSHINT=./node_modules/.bin/jshint
ISTANBUL=./node_modules/istanbul/lib/cli.js

cover:
	node $(ISTANBUL) cover --dir artifacts -- $(MOCHA) test.js --recursive --reporter spec

lint:
	@$(JSHINT) index.js test.js

test: lint
	$(MOCHA) test.js

watch:
	@$(MOCHA) -w index.js test.js


.PHONY: test watch cover lint
