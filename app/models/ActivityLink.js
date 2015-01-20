/**
 * Mongoose schema for an activity
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var generatePassword = require('password-generator');

var MAP_POINTS_NEEDED_TO_GET_FREE = 100;

var generateReferenceCode = function() {
    var REFERENCE_CODE_LENGTH = 10;
    return generatePassword(REFERENCE_CODE_LENGTH);
};

var activityLinkSchema = new Schema({
    activity: { type: Schema.Types.ObjectId, ref: 'Activity' },
    source: { type: Schema.Types.ObjectId, ref: 'Person' },
    target: { type: Schema.Types.ObjectId, ref: 'Person' },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    referenceCode: { type: String, default: generateReferenceCode }
});

// TODO: doc
activityLinkSchema.methods._updateTargetCapture = function(cb) {
    // Find out by which team the target would be captured
    var capturedByTeam = this.source.team;
    if (this.source.capture.active) {
        capturedByTeam = this.source.capture.team;
    }

    // Whether the target needs saving
    var needsSave = false;

    // Set the new capture of the target if it's not by it's own team
    if (this.target.team !== capturedByTeam) {
        this.target.capture = {
            active: true,
            person: this.source,
            team: capturedByTeam,
            pointsUntilFree: MAP_POINTS_NEEDED_TO_GET_FREE
        };
        needsSave = true;
    }
    else if (this.target.capture.active === true) {
        // The target got captured by its own team and is now free!
        this.target.capture = {
            active: false
        };
        needsSave = true;
    }

    if (needsSave) {
        return this.target.save(cb);
    }
    return cb();
};

// TODO: doc
activityLinkSchema.methods._updateSourceCapture = function(cb) {
    // If the source was captured, it freed itself
    if (this.source.capture.active) {
        this.source.capture = {
            active: false
        };
        return this.source.save(cb);
    }
    return cb();
};

activityLinkSchema.pre('save', function(next) {
    var that = this;
    var id = {};
    _.each(['source', 'target'], function (key) {
        if (typeof that[key] === 'string') {
            id[key] = that[key];
        }
        else {
            id[key] = that[key].id;
        }
    });
    if (id.source === id.target) {
        return next(new Error('ActivityLinks must have different source and target.'));
    }

    if (!that._wasAlreadyCompleted && typeof that.completedAt !== 'undefined') {
        // TODO: async.series
        that.populate('source target', function(err) {
            if (err) {
                return next(err);
            }
            that._updateTargetCapture(function(err) {
                if (err) {
                    return next(err);
                }
                that._updateSourceCapture(function(err) {
                    if (err) {
                        return next(err);
                    }
                    that._wasAlreadyCompleted = true;
                    return next();
                });
            });

        });
    }
    else {
        return next();
    }
});

activityLinkSchema.post('init', function() {
    this._wasAlreadyCompleted = (typeof this.completedAt !== 'undefined');
});


mongoose.model('ActivityLink', activityLinkSchema);
