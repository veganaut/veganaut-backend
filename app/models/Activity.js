/**
 * Mongoose schema for an activity
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var activitySchema = new Schema({
    name: String,
    className: String,
    timeLimit: {
        type: Number,
        default: 24 * 60 * 60 * 1000
    },
    givesVegBytes: Boolean
});

mongoose.model('Activity', activitySchema);
