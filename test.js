'use strict';
var expect         = require('chai').expect,
    parseFilter    = require('./index').parseFilter,
    match          = require('./index').match;


var simpleQuery   = { kind: 'motorway' },

    twoClause     = { kind: 'motorway', name: 'FDR'},

    threeClause   = { kind: 'motorway', name: 'FDR', id: 10 },

    differentClause = { kind: 'motorway', name: true },

    orPropertyClause = { kind: ['motorway', 'side-street']},
    
    uberQuery = { any: [
        { kind: 'motorway' },
        { '@zoom': 10},
        { name: true },
        { not: { kind: 'motorway' }},
        { },
        { all: [{ id: 10 }, { name: 'FDR' }, { highway: 'yes' }]},
        { '@zoom': { min: 14, max: 18 } }]};

//console.log(match(simpleQuery));
//console.log(match(twoClause));
//console.log(match(threeClause));
console.log(match(differentClause));
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

        });

    });

});


describe.skip('.match(filter)(context)', function () {

    it('should return a function', function () {
        expect(match(uberQuery)).to.be.a('function');
    });

});
