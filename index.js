'use strict';

var whiteList = ['not', 'any', 'all'];

function maybeQuote(value) {

    if (typeof value === 'string') {        
        return '"' + value + '"';
    }

    return value;
}

function lookUp(key) {
    if (key.lastIndexOf('@') === 0) {
        return 'context.' + key.slice(1);
    }
    return 'context.properties.' + key;
}


function propertyEqual(key, value) {
    return {
        type: 'propertyEqual',
        opt: '===' ,
        key: key,
        value: value,
        toString: function () {
            return '(' + maybeQuote(value) + ' ' + this.opt + ' ' + lookUp(key) + ')';
        }
        
    };
}

function propertyOr(key, values) {

    return {
        type: 'propertyOr',
        key: key,
        values: values.map(function (x) { return propertyEqual(key, x); }),
        toString: function () {
            return this.values.map(function (x) { return x.toString(); }).join(' || ');
        }
    };
}

function notProperty(key, value) {
    return {
        type: 'notProperty',
        key: key,
        value: value,
        toString: function () {
            return '!' + parseFilter(value).toString() + '';
        }
    };
}

function any(_, values) {
    return {
        type: 'any',
        values: values.map(function (x) { return parseFilter(x); }),
        toString: function () {
            return this.values.map(function (x) { return x.toString(); }).join(' || ');
        }
    };
}

function all(_, values) {
    return {
        type: 'all',
        values: values.map(function (x) { return parseFilter(x); }),
        toString: function () {
            return this.values.map(function (x) { return x.toString(); }).join(' && ');
        }
    };
}

function propertyMatchesBoolean(key, value) {
    return {
        key: key,
        value: value,
        toString: function () {
            return '((' + value + ' && !' + lookUp(key) +
                ' || (!' + value  +' && ' + lookUp(key) + '))';
        }
    };
}

function parseFilter(filter) {
    var filterAST = [];

    Object.keys(filter).forEach(function (key, idx) {

        var value = filter[key],
            type  = typeof value;


        if (type === 'string' || type === 'number') {

            filterAST.push(propertyEqual(key, value));

        } else if (type === 'boolean') {

            filterAST.push(propertyMatchesBoolean(key, value));

        } else if (whiteList.indexOf(key) >= 0) {
            switch (key) {
            case 'not':
                filterAST.push(notProperty(key, value));
                break;
            case 'any':
                filterAST.push(any(key, value));
                break;
            case 'all':
                filterAST.push(all(key, value));
            }

        } else if (Array.isArray(value)) {
            filterAST.push(propertyOr(key, value));
        } else if (type === 'object') {
            // TODO
        }

    });

    return filterAST;
}

function filterToString(filterAST) {
    return filterAST.join(' || ');
}

function match(filter) {
    // jshint evil: true
    return filterToString(parseFilter(filter));
}


module.exports = {
    match: match,
    filterToString: filterToString,
    parseFilter: parseFilter
};
