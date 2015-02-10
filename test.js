'use strict';
var expect         = require('chai').expect,
    parseFilter    = require('./index').parseFilter,
    filterToString = require('./index').filterToString,
    match          = require('./index').match;


var simpleQuery   = { kind: 'motorway' },

    twoClause     = { kind: 'motorway', name: 'FDR'},

    threeClause   = { kind: 'motorway', name: 'FDR', id: 10 },

    not              = { not: { any: [ {kind: 'motorway'}, { id: 10 }]}},
    rangeMatch       = { zoom: { max: 10, min: 2 }},
    differentClause  = { kind: 'motorway', name: true },
    nullValue        = { kind: null },
    orPropertyClause = { kind: ['motorway', 'side-street']},
    
    uberQuery = { any: [
        { kind: 'motorway' },
        { '@zoom': 10},
        { name: true },
        {},
        { not: { kind: 'motorway' }},
        { all: [{ id: 10 }, { name: 'FDR' }, { highway: 'yes' }]},
        { '@zoom': { min: 14, max: 18 } }]};

//console.log(match(simpleQuery));
//console.log(match(twoClause));
//console.log(match(threeClause));
// console.log(match(differentClause));
//console.log(match(not));
//console.log(match(rangeMatch));
//console.log(match(orPropertyClause));
//console.log(match(uberQuery));

describe.skip('.parseFilter()', function () {
    describe('when given a filter', function () {

        it('should generate a representation of that filter', function () {
            expect(parseFilter(simpleQuery)).to.be.equal({});
            expect(parseFilter(twoClause)).to.be.equal({});
            expect(parseFilter(threeClause)).to.be.equal({});
            expect(parseFilter(differentClause)).to.be.equal({});
            expect(parseFilter(orPropertyClause)).to.be.equal({});
            expect(parseFilter(not)).to.be.equal({});
            expect(parseFilter(rangeMatch)).to.be.equal({});
        });

    });

});



describe('.match(filter, context)', function () {
    var context = {
        feature: {
            properties: {
                kind: 'highway',
                highway: 'motorway',
                id: 10,
                a: NaN,
                b: null
            }
        },
        zoom: 10,
        meter_per_pixel: 100,
        units_per_meter: 100,
    };

    describe('empty filter', function () {
        describe('when given an undefined or null filter', function () {
            it('returns true', function () {
                expect(match()(context)).to.be.true();
                expect(match(null)(context)).to.be.true();
            });
        });
    });

    describe('filter on non feature values', function () {
        var subject = { '@zoom': 10 };
        describe('when the filter key has @ symbol', function () {
            it('returns true when the context has a matching value', function () {
                expect(match(subject)(context)).to.be.true();
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
    describe('when the filter property is a not expression', function () {
        var context = {
            feature: {
                properties: {
                    kind: 'highway'
                }
            }
        };
        describe('negation with single value', function () {
            it('returns false when the value does match', function () {
                var subject = { not: { kind: 'highway'}};
                expect(match(subject)(context)).to.be.false();
            });
            it('returns true when the value does not match', function () {
                var subject = { not: { kind: ' residential '}};
                expect(match(subject)(context)).to.be.true();
            });
        });
        describe('negation with many values', function () {
            var subject = { not: { kind: ['motorway', 'highway']}};
            it('returns false when either value does match', function () {
                expect(match(subject)(context)).to.be.false();
            });
        });
    });
    describe('when the filter key is any', function () {
        var context = {
            feature: {
                properties: {
                    kind: 'motorway',
                    id: 10
                }
            }
        };
        it('returns true if any of the values match', function () {
            var subject = { any: [{ kind: 'motorway'}, { id: 10 }, {not: { kind: 'motorway'}}]};
            expect(match(subject)(context)).to.be.true();
        });
    });
    describe('when the filter key is all', function () {
        var context = {
            feature: {
                properties: {
                    kind: 'motorway',
                    id: 10
                }
            }
        };
        it('only returns true if every clause matches', function () {
            var subject = { all: [{ kind: 'motorway'}, { id: 10}]};
            expect(match(subject)(context)).to.be.true();
        });
        describe('sub queries', function () {
            var context = {
                feature: {
                    properties: {
                        kind: 'motorway',
                        name: 'FDR',
                        id: 10
                    }
                }
            },
                subject = { all: [{ all: [ { kind: 'motorway'}, { name: 'FDR'}]},
                                  { any: [ { id: 10}, { type: 'linestring'}]}]};
            it('returns true when all sub queries match', function () {
                expect(match(subject)(context)).to.be.true();
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

