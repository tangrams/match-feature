'use strict';

var whiteList = ['not', 'any', 'all'];


function notNull(x) { return x != null; }
function toString(x) { return x.toString(); }

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
    return 'context.feature.properties.' + key;
}


function nullValue(key, value) {
    return {
        type: 'nullValue',
        key: key,
        toString: function () {
            return ' true ';
        }
    };
}

function propertyEqual(key, value) {
    return {
        type: 'propertyEqual',
        opt: '===' ,
        key: key,
        value: value,
        toString: function () {
            return '(' + maybeQuote(this.value) + ' ' + this.opt + ' ' + lookUp(key) + ')';
        }
        
    };
}

function propertyOr(key, values) {

    return {
        type: 'propertyOr',
        key: key,
        values: values.map(function (x) { return propertyEqual(key, x); }),
        toString: function () {
            return this.values.map(toString).join(' || ');
        }
    };
}

function notProperty(key, value) {
    return {
        type: 'notProperty',
        key: key,
        value: parseFilter(value),
        toString: function () {
            return '!(' + this.value.toString() + ')';
        }
    };
}

function any(_, values) {
    return {
        type: 'any',
        values: values.map(parseFilter),
        toString: function () {
            return this.values.filter(notNull).map(toString).join(' || ');
        }
    };
}

function all(_, values) {
    return {
        type: 'all',
        values: values.filter(notNull).map(parseFilter),
        toString: function () {
            return this.values.filter(notNull).map(toString).join(' && ');
        }
    };
}

function propertyMatchesBoolean(key, value) {
    return {
        type: 'propertyMatchesBoolean',
        key: key,
        value: value,
        toString: function () {
            return '(' + lookUp(this.key) + (this.value ? ' != ' : ' == ')  + 'null)';
        }
    };
}

function rangeMatch(key, values) {
    return {
        type: 'rangeMatch',
        key: key,
        values: values,
        toString: function () {
            var expressions = [];
            if (this.values.max) {
                expressions.push('' + lookUp(key) + ' <= ' + this.values.max);
            }

            if (this.values.min) {
                expressions.push('' + lookUp(key) + ' >= ' + this.values.min);
            }

            return '(' + expressions.join(' && ') + ')';
        }
    };
}

function parseFilter(filter) {
    var filterAST = [],
        keys      = Object.keys(filter);

    keys.forEach(function (key, idx) {

        var value = filter[key],
            type  = typeof value;
        if (type === 'string' || type === 'number') {
            filterAST.push(propertyEqual(key, value));
        } else if (type === 'boolean') {
            filterAST.push(propertyMatchesBoolean(key, value));
        } else if (value == null) {
            filterAST.push(nullValue(key, value));
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
        } else if (type === 'object' && value != null) {
            if (value.max || value.min) {
                filterAST.push(rangeMatch(key, value));
            }
        }
    });

    return keys.length === 0 ? null : filterAST;
}

function filterToString(filterAST) {
    return '(' + filterAST.filter(notNull).join(' || ') + ')';
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
