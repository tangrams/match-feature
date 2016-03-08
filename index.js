'use strict';

function notNull(x)  { return x != null; }
function wrap(x)     { return '(' + x + ')';}

function maybeQuote(value) {
    if (typeof value === 'string') {
        return '"' + value + '"';
    }
    return value;
}

function lookUp(key) {
    if (key[0] === '$') {
        return 'context.' + key.substring(1);
    }
    return 'context.feature.properties.' + key;
}

function nullValue(key, value) {
    return ' true ';
}

function propertyEqual(key, value) {
    return wrap(maybeQuote(value) + ' === ' + lookUp(key));
}

function propertyOr(key, values) {
    return wrap(values.map(function (x) { return propertyEqual(key, x); }).join(' || '));
}

function not(key, value) {
    return '!' + wrap(parseFilter(value));
}

function none(key, values) {
    return '!' + wrap(any(null, values));
}

function printNested(values, joiner) {
    return wrap(values.filter(notNull).map(function (x) {
        return wrap(x.join(' && '));
    }).join(' ' + joiner + ' '));
}

function any(_, values) {
    return printNested(values.map(parseFilter), '||');
}

function all(_, values) {
    return printNested(values.filter(notNull).map(parseFilter), '&&');
}

function propertyMatchesBoolean(key, value) {
    return wrap(lookUp(key) + (value ? ' != ' : ' == ')  + 'null');
}

function rangeMatch(key, values) {
    var expressions = [];

    if (values.max) {
        expressions.push('' + lookUp(key) + ' < ' + values.max);
    }

    if (values.min) {
        expressions.push('' + lookUp(key) + ' >= ' + values.min);
    }

    return wrap(expressions.join(' && '));
}

function parseFilter(filter) {
    var filterAST = [];

    // Function filter
    if (typeof filter === 'function') {
        filterAST.push(wrap(filter.toString() + '(context)'));
        return filterAST;
    }
    // Array filter, implicit 'any'
    else if (Array.isArray(filter)) {
        filterAST.push(any(null, filter));
        return filterAST;
    }

    // Object filter, e.g. implicit 'all'
    var keys = Object.keys(filter);
    for (var k=0; k < keys.length; k++) {
        var key = keys[k];

        var value = filter[key],
            type  = typeof value;
        if (type === 'string' || type === 'number') {
            filterAST.push(propertyEqual(key, value));
        } else if (type === 'boolean') {
            filterAST.push(propertyMatchesBoolean(key, value));
        } else if (value == null) {
            filterAST.push(nullValue(key, value));
        } else if (key === 'not') {
            filterAST.push(not(key, value));
        } else if (key === 'any') {
            filterAST.push(any(key, value));
        } else if (key === 'all') {
            filterAST.push(all(key, value));
        } else if (key === 'none') {
            filterAST.push(none(key, value));
        } else if (Array.isArray(value)) {
            filterAST.push(propertyOr(key, value));
        } else if (type === 'object' && value != null) {
            if (value.max || value.min) {
                filterAST.push(rangeMatch(key, value));
            }
        } else {
            throw new Error('Unknown Query sytnax: ' + value);
        }
    }

    return keys.length === 0 ? ['true'] : filterAST;
}

function filterToString(filterAST) {
    return wrap(filterAST.join(' && '));
}

function match(filter) {
    if (filter == null) { return function () { return true; }; }
    // jshint evil: true
    return new Function('context', 'return ' + filterToString(parseFilter(filter)) + ';');
}

module.exports = {
    match: match,
    filterToString: filterToString,
    parseFilter: parseFilter
};
