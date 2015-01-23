MOCHA=./node_modules/mocha/bin/mocha


test:
	$(MOCHA) test.js

watch:
	@$(MOCHA) -w index.js test.js


.PHONY: test watch
