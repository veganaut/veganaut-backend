
'use strict';

var _ = require('lodash');

/**
 * We calculate a "rank" of the average that can be used for
 * sorting by the average. For the rank, a number of exactly
 * average shadow values are added to the actual values, to
 * discount items that have only a very small amount of values
 * @type {number}
 */
var RANK_NUM_AVERAGE_RATINGS = 2;


var ratingModelAddOn = function(name, min, max, DataTypes, Model, schema, options) {
    // Calculate the average value of this rating
    var average = (min + max) / 2;

    // Set up some names of properties and methods
    var totalAttributeName = name + 'Total';
    var countAttributeName = name + 'Count';
    var rankAttributeName = name + 'Rank';
    var averageGetterName = name + 'Average';
    var addRatingMethodName = 'add' + _.capitalize(name);
    var replaceRatingMethodName = 'replace' + _.capitalize(name);

    /**
     * Helper method to set the current rank
     * @param instance An instance of the model
     */
    var recalculateRank = function(instance) {
        instance[rankAttributeName] = (instance[totalAttributeName] + average * RANK_NUM_AVERAGE_RATINGS) /
            (instance[countAttributeName] + RANK_NUM_AVERAGE_RATINGS)
        ;
    };

    var validateRating = function(rating) {
        if (typeof rating !== 'number' ||
            isNaN(rating) ||

            // Must be an integer and between max & min
            Math.round(rating) !== rating ||
            rating > max ||
            rating < min)
        {
            throw new Error('Rating of ' + rating + ' not allowed for ' + Model.name + '.' + name);
        }
        return Math.round(rating);
    };

    // Add the columns we need to the schema
    schema[totalAttributeName] = {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    };
    schema[countAttributeName] = {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    };
    schema[rankAttributeName] = {
        type: DataTypes.REAL,
        defaultValue: 0.0,
        allowNull: false
    };

    // Add getter to compute the average
    options.getterMethods = options.getterMethods || {};
    options.getterMethods[averageGetterName] = function() {
        var average = this[totalAttributeName] / this[countAttributeName];
        if (isNaN(average)) {
            average = 0;
        }
        return average;
    };

    // Add method to the model to add a rating
    Model.prototype[addRatingMethodName] = function(value) {
        this[totalAttributeName] += validateRating(value);
        this[countAttributeName] += 1;
        recalculateRank(this);
    };

    // Add method to the model to replace a rating
    Model.prototype[replaceRatingMethodName] = function(oldValue, newValue) {
        this[totalAttributeName] += validateRating(newValue) - validateRating(oldValue);
        recalculateRank(this);
    };
};

module.exports = ratingModelAddOn;
