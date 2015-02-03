'use strict';

function withIn(value, expected, tolerance) {
    var lessThan = ((expected - tolerance) <= value);
    if (lessThan === false) {
        console.log('value is to small');
        return false;
    }
    var gt = ((expected + tolerance) >= value);
    if (gt === false) {
        console.log('value is greater than');
        return false;
    }
    return true;
}


var
    assert = require('assert'),
    match = require('./index').match;

var
    q = { any: [ {any: [ { any: [ { any: [ { kind: 'motorway'}]}]}]} ]},
    context = {
        feature: {
            properties: {
                kind: 'motorway'
            }
        }
    };


var start = new Date();

for (var i = 0; i < 100000; i += 1) {
    match(q)(context);
}
var end = new Date();


assert.ok(withIn(end - start, 500, 30));
