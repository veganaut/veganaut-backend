/**
 * Mongoose schema for a Product: something that is sold
 * at a Location
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    location: {type: Schema.Types.ObjectId, ref: 'Location', required: true},
    name: { type: String, required: true },
    description: { type: String }
});

/**
 * Method called automatically before sending a product
 * through the API.
 * @returns {Object}
 */
productSchema.methods.toJSON = function() {
    return _.assign(
        _.pick(this, ['name', 'description']),
        {
            id: this.id
        }
    );
};

var Product = mongoose.model('Product', productSchema);

module.exports = Product;
