'use strict';

exports.whiteList = ['any', 'not', 'all'];

exports.nonFeaturePrefix = '@';

function matchFeatureObject(filter, context) {
    var feature = context.feature,
        type,
        property;

    for (var key in filter) {
        type = typeof filter[key];

        if (exports.whiteList.indexOf(key) < 0) {

            if (type === 'string' || type === 'number') {

                if (key.lastIndexOf(exports.nonFeaturePrefix) === 0) {
                    property = context[key.slice(exports.nonFeaturePrefix.length, key.length)];
                } else {
                    property = feature.properties[key];
                }

                if (!Object.is(filter[key], property)) {
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
        } else if (exports.whiteList.indexOf(key) >= 0) {
            switch (key) {
            case 'not':
                return !matchFeatureObject(filter.not, context);
            case 'any':
                return filter.any.some(function (x) { return matchFeatureObject(x, context); });
            case 'all':
                return filter.all.every(function (x) { return matchFeatureObject(x, context); });
            }
        } else {
            return false;
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
