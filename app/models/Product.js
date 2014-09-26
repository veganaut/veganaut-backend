/**
 * Mongoose schema for a Product: something that is sold
 * at a Location
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    location: {type: Schema.Types.ObjectId, ref: 'Location', required: true},
    name: { type: String, required: true },
    description: { type: String }
});

var Product = mongoose.model('Product', productSchema);

module.exports = Product;
