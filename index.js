
var whiteList = ['any', 'not', 'all'];

function matchFeatureObject(filter, context, parent) {
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
            } else if (type === 'object') {
                return matchFeatureObject(filter[key], context, key);
            }
        } else if (whiteList.indexOf(key) >= 0) {
            if (parent !== undefined) {
                switch (key) {
                case 'not':
                    return 'not';
                case 'any':
                    return 'any';
                case 'all':
                    return 'all';
                }                
            } else {
                throw new Error();
            }
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
        return function () { return true; };
    }
};


exports.match = function (filter) {
    filter = exports.buildFilter(filter);
    return function (context, options) {
        return filter(context);
    };
};
