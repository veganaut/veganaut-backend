/**
 * Mongoose schema for a Product: something that is sold
 * at a Location
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Person',
        required: true
    },
    sid: {
        type: String,
        unique: true,
        sparse: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    activeAt: {
        type: Date,
        default: Date.now
    },
    userAgent: {
        type: String
    }
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
