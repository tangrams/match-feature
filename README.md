
# Match features

[![Circle CI](https://circleci.com/gh/tangrams/match-feature.png?style=badge&circle-token=95c1d455e04f9551fb29d66f95546a5f5c92878a)](https://circleci.com/gh/tangrams/match-feature)


```javascript

var match = require('match-feature').match;

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
}

match({ kind: 'motorway' })(context) // true

match({ kind: 'motorway', name: 'FDR'})(context) // true

match({ kind: 'motorway', name: 'FDR', id: 10 })(context) // true

match({ not: { any: [ {kind: 'motorway'}, { id: 10 }]}})(context)

match({ $zoom: { max: 10, min: 2 }})(context) // true

match({ kind: 'motorway', name: true })(context) // true

match({ kind: ['motorway', 'side-street']})(context) // true

match({ any: [
        { kind: 'motorway' },
        { $zoom: 10},
        { name: true },
        { not: { kind: 'motorway' }},
        { all: [{ id: 10 }, { name: 'FDR' }, { highway: 'yes' }]},
        { $zoom: { min: 14, max: 18 } }]})(context)

```
