'use strict';
var expect = require('chai').expect,
    _      = require('underscore');

function makeContext(props, etc) {
    return _.extend({
        feature: {
            properties: _.extend(props)
        }}, etc);
}

describe('.match(filter, context)', function () {
    var match = require('./index').match;

    var context = makeContext({
        kind: 'highway',
        highway: 'motorway',
        id: 10,
        a: NaN,
        b: null
    }, {zoom: 10});


    describe('empty filter', function () {
        describe('when given an undefined or null filter', function () {
            it('returns true', function () {
                expect(match()(context)).to.be.true();
                expect(match(null)(context)).to.be.true();
            });
        });

        describe('when match is given an empty object', function () {

            it('returns true', function () {
                expect(match({})(context)).to.be.true();
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

    describe('`property-or`', function () {
        var context = makeContext({a: 'b'}),
            filter = { a: ['a', 'b', 'c']};

        describe('and the feature value matches one of the values', function () {
            it('returns true', function () {
                expect(match(filter)(context)).to.be.true();
            });
        });
        describe('and the feature values does not match one of the values', function () {
            it('returns false', function () {
                expect(match(filter)(makeContext({ a: 'e'}))).to.be.false();
            });
        });
    });

    describe('`range`', function () {
        var context = makeContext({
            a: 10,
            b: 10
        });

        it('returns true when the property is within that range', function () {
            expect(match({a: {max: 11, min: 9}})(context)).to.be.true();
        });

        it('returns false when the property is outside that range', function () {
            expect(match({b: {max: 5, min: 1}})(context)).to.be.false();
        });

        describe('when there is just a min value', function () {
            it('returns when that value is above the min value', function () {
                expect(match({b: {min: 9}})(context)).to.be.true();
            });
        });
    });

    describe('`not`', function () {
        var context = makeContext({ kind: 'highway'});

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
    describe('`any`', function () {
        var context = makeContext({
            kind: 'motorway',
            id: 10
        });

        it('returns true if any of the values match', function () {

            expect(match({ any: [{ kind: 'motorway'}, { id: 10 },
                                 { not: { kind: 'motorway'}}]})(context))
                .to.be.true();
        });

        it('returns false if all of the properties do not match', function () {
            expect(match({ any: [{kind: 'highway'},
                                 {id: 20}]})(context))
                .to.be.false();
        });

        describe('nested queryies', function () {

            it('returns true when at least one of filters match', function () {
                expect(match({ any: [{ any: [{kind: 10}]},
                                     { any: [{ id: 5}, { any: [{id: 10}, {id: 3.14}]}]}]})(context))
                    .to.be.true();
            });

            it('returns false none of them match', function () {
                expect(match({ any: [{ any: [{kind: 10}]},
                                     { any: [{ id: 5}]}]})(context)).
                    to.be.false();
            });
        });
    });

    describe('`all`', function () {
        var context = makeContext({
            kind: 'motorway',
            id: 10
        });

        it('only returns true if every clause matches', function () {
            expect(match({ all: [{ kind: 'motorway'},
                                 { id: 10}]})(context))
                .to.be.true();
        });

        describe('sub queries', function () {
            var context =  makeContext({
                        kind: 'motorway',
                        name: 'FDR',
                        id: 10
            }),
                subject = { all: [{ all: [ { kind: 'motorway'}, { name: 'FDR'}]},
                                  { any: [ { id: 10}, { type: 'linestring'}]}]};


            it('returns true when all sub queries match', function () {
                expect(match(subject)(context)).to.be.true();
            });
        });

        describe('nested queries', function () {

            var subject = { kind: 'minor_road',
                            any: [ { aeroway: 'runway' },
                                   { aeroway: 'taxiway',
                                     '@zoom': { min: 15 } } ] };

            it('reutrns true', function () {
                expect(match(subject)(makeContext({
                    kind: 'minor_road',
                    aeroway: 'runway'
                }))).to.be.true();
            });

            it('returns false', function () {                
                expect(match(subject)(makeContext({
                    kind: 'minor_road',
                    aeroway: 'taxiway'
                }, { zoom: 1 }))).to.be.false();
            });

            it('return true', function () {
                expect(match(subject)(makeContext({
                    kind: 'minor_road',
                    aeroway: 'taxiway'
                }, {zoom: 17}))).to.be.true();
            });

        });


    });

    describe('`boolean`', function () {
        var context = makeContext({
            a: {},
            b: undefined,
            c: [],
            d: true,
            e: 0
        });

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
                expect(match({e: true})(context)).to.be.true();
            });
        });
    });
});

