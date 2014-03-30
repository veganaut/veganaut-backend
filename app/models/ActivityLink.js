/**
 * Mongoose schema for an activity
 */

'use strict';

var _ = require('lodash');
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

ActivityLinkSchema.pre('save', function(next) {
    var that = this;
    var id = {};
    _.each(['source', 'target'], function (key) {
        if (typeof that[key] === 'string') {
            id[key] = that[key];
        } else {
            id[key] = that[key].id;
        }
    });
    if (id.source === id.target) {
        console.log(id);
        console.log((new Error()).stack);
        return next(new Error('ActivityLinks must have different source and target.'));
    }
    return next();
});


mongoose.model('ActivityLink', ActivityLinkSchema);
