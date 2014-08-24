/**
 * Mongoose schema for a location.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationSchema = new Schema({
    coordinates: {type: [Number], index: '2d'},
    name: String,
    type: {type: String, enum: ['gastronomy', 'retail', 'event', 'private']}
});


mongoose.model('Location', LocationSchema);
