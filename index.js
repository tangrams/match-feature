/*

 AND
function () { return (feature.kind != 'ocean' && feature.kind != 'riverbank') && zoom >= 14; }

{ zoom: 14, not: { kind: [ocean, riverbank] } }

OR 

function () { return ( zoom >= 16) || (zoom >= 15 && feature.height > 20) }

{ any: [{ zoom: { min: 16 } }, { zoom: { min: 15 }, height: { min: 20 } }]}

  Zoom-specific handling
 Minimum thresholds are INCLUSIVE, maximum thresholds are EXCLUSIVE
 The following syntax forms are accepted:
    filter: { scene.zoom: 14 }                  # zoom >= 14
    filter: { scene.zoom: { max: 18 }           # zoom < 18
    filter: { scene.zoom: { min: 14, max: 18 }  # 14 <= zoom < 18
    filter: { scene.zoom: [14, 18] }            # 14 <= zoom < 18
*/


var whiteList = ['any', 'not', 'all'];

function matchFeatureObject(filter, context) {
    var feature = context.feature;

    for (var key in filter) {
        var type = typeof filter[key];

        if (whiteList.indexOf(key) < 0) {
            if (type === 'string' || type === 'number') {
                if (!Object.is(filter[key], feature.properties[key])) {
                    return false;
                }                
            } else if (type === 'boolean') {                
                if ((filter[key] && !feature.properties[key]) || (!filter[key] && feature.properties[key])) {
                    return false;
                }
            } else if (Array.isArray(filter[key])) {
                return filter[key].indexOf(feature.properties[key]) >= 0;
            }

        } else if (whiteList.indexOf(key) >= 0) {
            // handle any, not, all
        } else {
            return false; // should we throw?
        }
    }
    return true;
}



exports.buildFilter = function (filter) {
    switch (Object.prototype.toString.call(filter)) {
    case '[object Object]':
        return matchFeatureObject.bind(null, filter);
    case '[object Null]':
    case '[object Undefined]':
        return function () { return true; };
    default:
        return filter;
    }
};


exports.match = function (filter) {
    filter = exports.buildFilter(filter);
    return function (context, options) {
        return filter(context);
    };
};
