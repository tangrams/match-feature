'use strict';

exports.whiteList = ['any', 'not', 'all'];

exports.nonFeaturePrefix = '@';

function matchFeatureObject(filter, context) {
    var feature = context.feature,
        type,
        value,
        length,
        property;

    for (var key in filter) {
        value = filter[key];
        type  = typeof value;

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
                if ((value && !feature.properties[key]) || (!value && feature.properties[key])) {
                    return false;
                }
            } else if (Array.isArray(value)) {
                return value.indexOf(feature.properties[key]) >= 0;
            } else if (type === 'object') {
                return matchFeatureObject(value, context, key);
            }
        } else if (exports.whiteList.indexOf(key) >= 0) {
            switch (key) {
            case 'not':
                return !matchFeatureObject(filter.not, context);
            case 'any':
                length = filter.any.length;
                for (var i = 0; i < length; i += 1) {
                    if (matchFeatureObject(filter.any[i], context)) {
                        return true;
                    }
                }
                return false;
            case 'all':
                length = filter.all.length;
                for (var x = 0; x < length; x += 1) {
                    if (!matchFeatureObject(filter.all[x], context)) {
                        return false;
                    }
                }
                return true;
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
    /* falls through */
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
