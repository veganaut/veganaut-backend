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
        type: String,
        required: true,
        default: 2,
        enum: [0, 1, 2]
    }
});

// Keep track of the rating of this product
new Average('rating', 1, 5, productSchema);

/**
 * Callback to notify the location that a new mission has been completed.
 * The product will update its score or other changed fields.
 * @param {Mission} mission The mission that was completed
 * @param {{}} productOutcome The outcome of the mission regarding this product
 * @param {Function} next
 */
productSchema.methods.notifyProductMissionCompleted = function(mission, productOutcome, next) {
    var shouldSave = false;
    if (mission instanceof Missions.RateOptionsMission) {
        // Add the new rating
        this.addRating(productOutcome.info);
        shouldSave = true;
    }
    else if (mission instanceof Missions.UpdateProductMission) {
        // Update the given field. We trust the mission to only update allowed fields.
        if (productOutcome.field === 'availability') {
            this.availability = constants.PRODUCT_AVAILABILITIES_STRING_TO_VALUE[productOutcome.value];
        }
        else {
            this[productOutcome.field] = productOutcome.value;
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
