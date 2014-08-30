/**
 * Mongoose schema for an activity
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var generatePassword = require('password-generator');

var generateReferenceCode = function() {
    var REFERENCE_CODE_LENGTH = 10;
    return generatePassword(REFERENCE_CODE_LENGTH);
};

var activityLinkSchema = new Schema({
    activity: { type: Schema.Types.ObjectId, ref: 'Activity' },
    source: { type: Schema.Types.ObjectId, ref: 'Person' },
    target: { type: Schema.Types.ObjectId, ref: 'Person' },
    location: String,
    startDate: Date,
    success: { type: Boolean, default: false },
    referenceCode: { type: String, default: generateReferenceCode }
});

activityLinkSchema.pre('save', function(next) {
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
        return next(new Error('ActivityLinks must have different source and target.'));
    }
    return next();
});


mongoose.model('ActivityLink', activityLinkSchema);
