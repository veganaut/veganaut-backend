/**
 * Mongoose schema for a Product: something that is sold
 * at a Location
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    name: { type: String, required: true }
});

mongoose.model('Product', productSchema);
