var expect = require('chai').expect,
    match  = require('./index').match;

describe('.match(filter, context)', function () {
    var context = {
        'feature': {
            properties: {
                kind: 'highway',
                highway: 'motorway',
                id: 10,
                a: NaN,
                b: null
            }
        },
        '@zoom': 10,
        '@meter-per-pixel': 100,
        '@units-per-meter': 100,
    };

    
    describe('empty filter', function () {

        describe('when given an undefined or null filter', function () {
            it('returns true', function () {
                expect(match()(context)).to.be.true();
                expect(match(null)(context)).to.be.true();
            });            
        });
    });

    describe('simple filters', function () {


        describe('when the filter matches the feature', function () {
            var filter = { kind: 'highway', highway: 'motorway' };
            it('returns true', function () {
                expect(match(filter)(context)).to.be.true();
            });
        });

        describe('when the value is an number', function () {
            it('returns true', function () {
                expect(match({ id: 10 })(context)).to.be.true();
            });

            it('handles NaN correctly', function () {
                expect(match({ a: NaN })(context)).to.be.true();
            });
        });
        
        describe('when the filters does not match', function () {
            var filter = { stuff: 'is-true?', kind: 'motorway' };
            it('returns false', function () {
                expect(match(filter)(context)).to.be.false();
            });
        });

        describe('when the value in the filter is null and the property is null', function () {
            it('returns true', function () {
                expect(match({b: null})(context)).to.be.true();
            });
        });

    });

    describe('when the filter value is an array', function () {
        var context = {
            feature: {
                properties: {
                    a: 'b'
                }
            }
        },
            filter = { a: ['a', 'b', 'c']};

        describe('and the feature value matches one of the values', function () {
            it('returns true', function () {
                expect(match(filter)(context)).to.be.true();
            });
        });

        describe('and the feature values does not match one of the values', function () {
            it('returns false', function () {
                expect(match(filter)({feature: { properties: { a: 'e'}}})).to.be.false();
            });
        });
    });

    describe('when the filter value is a boolean', function () {
        var context = {
            feature: {
                properties: {
                    a: {},
                    b: '',
                    c: [],
                    d: true,
                    e: 0
                }
            }
        };

        describe('the feature property must match the truthiness of the key', function () {

            it('{a: true}', function () {
                expect(match({ a: true })(context)).to.be.true();
            });

            it('{a: false}', function () {
                expect(match({ a: false})(context)).to.be.false();
            });

            it('{b: false}', function () {
                expect(match({ b: false})(context)).to.be.true();
            });

            it('{c: true}', function () {
                expect(match({c: true})(context)).to.be.true();
            });

            it('{d: true}', function () {
                expect(match({d: true})(context)).to.be.true();
            });

            it('{e: false}', function () {
                expect(match({e: false})(context)).to.be.true();
            });
        });
    });

});
