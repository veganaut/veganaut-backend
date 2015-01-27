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

/**
 * We calculate a "rank" of the average that can be used for
 * sorting by the average. For the rank, a number of exactly
 * average shadow values are added to the actual values, to
 * discount items that have only a very small amount of values
 * @type {number}
 */
var RANK_NUM_AVERAGE_RATINGS = 2;

/**
 * Average constructor
 * @param {string} name Name of the average field
 * @param {number} min Minimum possible value
 * @param {number} max Maximum possible value
 * @param {Schema} schema Schema to add the field to
 * @constructor
 */
var Average = function(name, min, max, schema) {
    var that = this;

    that.minValue = min;
    that.maxValue = max;
    that.averageValue = (min + max) / 2;

    that.propertyName = inflection.pluralize(name);
    that.virtualName = that.propertyName + '.average';
    that.addMethodName = 'add' + inflection.classify(name);

    // A property used to compute our average
    var averageProperty = {};
    averageProperty[that.propertyName] = {
        total: Number,
        count: Number,
        rank: Number
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
        var property = this[that.propertyName];
        property.total += value;
        property.count += 1;
        property.rank = (property.total + that.averageValue * RANK_NUM_AVERAGE_RATINGS) /
            (property.count + RANK_NUM_AVERAGE_RATINGS)
        ;

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
        if (typeof this[that.propertyName].rank !== 'number') {
            this[that.propertyName].rank = 0;
            this.markModified(that.propertyName);
        }

        if (this[that.propertyName].count < 0) {
            return next(new Error('negative count in ' + that.propertyName));
        }

        next();
    });
};

module.exports = Average;
