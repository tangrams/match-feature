'use strict';

var
    ff     = require('feature-filter'),
    match  = require('./index').match;

var q = { any: [ {any: [ { any: [ { any: [ { kind: 'motorway'}]}]}]} ]},
    context = {
        feature: {
            properties: {
                kind: 'motorway'
            }
        }
    };

var ffilter = ['any', ['any', ['any', [ 'any', ['==', 'kind', 'motorway']]]]];

function runFF(times) {
    var start = new Date(), end,
        filter = ff(ffilter);

    for (var i = 0; i < times; i += 1) {
        filter(context.feature);
    }
    end = new Date();
    return end - start;    
}

function run(times) {
    var start = new Date(), end,
        filter = match(q);

    for (var i = 0; i < times; i += 1) {
        filter(context);
    }
    end = new Date();
    return end - start;    
}

function runTests(times, run) {
    var runs = [];
    for (var i = 0; i < times; i += 1) {
        runs.push(run(1000));
    }
    return runs;
}

function prepResults(runs) {
    runs = runs.sort(function (a, b) { return a - b; });
    runs = runs.slice(1);
    runs = runs.slice(0, runs.length - 1);
    return runs;
}

function findAverage(runs) {
    runs = prepResults(runs);
    var sum = runs.reduce(function (a, x) { return a + x; }, 0);
    return sum / runs.length;
}

var average1 = findAverage(runTests(10000, run));
var average2 = findAverage(runTests(10000, runFF));

console.log('Average run time for match feature: ' + average1);
console.log('Average run time for feature filter: ' + average2);

//expect(average1).to.be.closeTo(5, 0.2);
