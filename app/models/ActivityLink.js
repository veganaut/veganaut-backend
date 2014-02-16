/**
 * Mongoose schema for an activity
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    sources: [ { type: Schema.Types.ObjectId, ref: 'Person' } ],
    targets: [ { type: Schema.Types.ObjectId, ref: 'Person' } ],
    location: String,
    startDate: Date,
    success: { type: Boolean, default: false },
    referenceCode: { type: String, default: generateReferenceCode }
});

mongoose.model('ActivityLink', ActivityLinkSchema);
