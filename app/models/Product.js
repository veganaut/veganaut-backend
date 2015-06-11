/**
 * Mongoose schema for a Product: something that is sold
 * at a Location
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../utils/constants');
var Average = require('../utils/Average');
var Missions = require('./Missions');

var productSchema = new Schema({
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    availability: {
        type: Number,
        required: true,
        default: constants.PRODUCT_AVAILABILITIES_STRING_TO_VALUE.available,
        enum: constants.PRODUCT_AVAILABILITY_VALUES
    }
});

// Keep track of the rating of this product
new Average('rating', 1, 5, productSchema);


/**
 * Static method that returns the sorting string to be used when getting lists
 * of products.
 * @returns {string}
 */
productSchema.statics.getDefaultSorting = function() {
    return '-availability -ratings.rank -ratings.count name';
};

/**
 * Callback to notify the location that a new mission that modifies this
 * product has been completed.
 * The product will update its score or other changed fields.
 * @param {Mission} mission The mission that was completed
 * @param {Function} next
 */
productSchema.methods.notifyProductModifyingMissionCompleted = function(mission, next) {
    var shouldSave = false;
    if (mission instanceof Missions.RateProductMission) {
        // Add the new rating
        this.addRating(mission.outcome.info);
        shouldSave = true;
    }
    else if (mission instanceof Missions.UpdateProductMission) {
        // Update the given field. We trust the mission to only update allowed fields.
        if (mission.outcome.field === 'availability') {
            this.availability = constants.PRODUCT_AVAILABILITIES_STRING_TO_VALUE[mission.outcome.value];
        }
        else {
            this[mission.outcome.field] = mission.outcome.value;
        }
        shouldSave = true;
    }

    if (shouldSave) {
        return this.save(next);
    }
    return next();
};

/**
 * Method called automatically before sending a product
 * through the API.
 * @returns {Object}
 */
productSchema.methods.toJSON = function() {
    return _.assign(
        _.pick(this, ['name', 'description', 'location']),
        {
            id: this.id,
            rating: {
                average: this.ratings.average,
                numRatings: this.ratings.count
            },
            availability: constants.PRODUCT_AVAILABILITIES_VALUE_TO_STRING[this.availability]
        }
    );
};

var Product = mongoose.model('Product', productSchema);

module.exports = Product;
