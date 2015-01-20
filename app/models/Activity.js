/**
 * Mongoose schema for an activity
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var activitySchema = new Schema({
    name: String, // TODO: name should be a translation key?!
    className: String,
    timeLimit: {
        type: Number,
        default: 24 * 60 * 60 * 1000
    }
});

mongoose.model('Activity', activitySchema);
