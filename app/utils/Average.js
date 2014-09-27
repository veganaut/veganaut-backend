/**
 * An average value that can be added to a mongoose schema.
 *
 * Usage:
 *
 * new Average('score', locationSchema);
 *
 * This will add
 *   - a property called 'scores' that is saved in the database.
 *     Consider this private and opaque.
 *   - a getter called 'scores.average',
 *   - a method 'addScore' to add a value
 *   - a pre-save hook that validates this property
 */

'use strict';

var inflection = require('inflection');

var Average = function(name, schema) {

    var that = this;
    that.propertyName = inflection.pluralize(name);
    that.virtualName = that.propertyName + '.average';
    that.addMethodName = 'add' + inflection.classify(name);

    // A property used to compute our average
    var averageProperty = {};
    averageProperty[that.propertyName] = {
        total: Number,
        count: Number
    };
    schema.add(averageProperty);

    // A getter to compute the average
    schema.virtual(that.virtualName).get(function() {
        var average = this[that.propertyName].total / this[that.propertyName].count;
        if (isNaN(average)) {
            average = 0;
        }
        return average;
    });

    // A method to add a value
    schema.methods[that.addMethodName] = function(value) {
        this[that.propertyName].total += value;
        this[that.propertyName].count += 1;
        this.markModified(that.propertyName);
    };

    // A pre-save hook that validates the property
    schema.pre('save', function(next) {
        // set defaults
        if (typeof this[that.propertyName].total !== 'number') {
            this[that.propertyName].total = 0.0;
            this.markModified(that.propertyName);
        }
        if (typeof this[that.propertyName].count !== 'number') {
            this[that.propertyName].count = 0;
            this.markModified(that.propertyName);
        }

        if (this[that.propertyName].count < 0) {
            return next(new Error('negative count in ' + that.propertyName));
        }

        next();
    });
};

module.exports = Average;
