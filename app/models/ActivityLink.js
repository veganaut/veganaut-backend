/**
 * Mongoose schema for an activity
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// TODO: make reference codes that can be remembered and typed easily (on phones)
var generateReferenceCode = function() {
    var ALPHABET = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ';
    var REFERENCE_CODE_LENGTH = 6;
    var result = '';
    for (var i = 0; i < REFERENCE_CODE_LENGTH; ++i) {
        result = result + ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return result;
};

var ActivityLinkSchema = new Schema({
    activity: { type: Schema.Types.ObjectId, ref: 'Activity' },
    source: { type: Schema.Types.ObjectId, ref: 'Person' },
    target: { type: Schema.Types.ObjectId, ref: 'Person' },
    location: String,
    startDate: Date,
    success: { type: Boolean, default: false },
    referenceCode: { type: String, default: generateReferenceCode }
});

mongoose.model('ActivityLink', ActivityLinkSchema);
