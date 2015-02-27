/**
 * Mongoose schema for a person.
 *
 * Password hashing inspired by http://blog.mongodb.org/post/32866457221/password-authentication-with-mongoose-part-1
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Schema = mongoose.Schema;
var constants = require('../utils/constants');

require('./ActivityLink');
var ActivityLink = mongoose.model('ActivityLink');

var bcrypt = require('bcrypt');
var BCRYPT_WORK_FACTOR = 10;
var cryptoUtils = require('../utils/cryptoUtils');


var personSchema = new Schema({
    email: {type: String, unique: true, sparse: true},
    password: String,
    nickname: String,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    fullName: String,
    // dateOfBirth can be just a year, year-month, or year-month-day
    dateOfBirth: {type: String, matches: /^\d{4}(?:-\d\d){0,2}$/},

    phone: String,
    address: String,
    gender: {type: String, enum: ['male', 'female', 'other']},
    locale: {type: String, default: 'en', enum: ['en', 'de']},

    team: {type: String, enum: constants.TEAMS},
    capture: {
        active: {type: Boolean, default: false},
        person: {type: Schema.Types.ObjectId, ref: 'Person'},
        team: {type: String, enum: constants.TEAMS},
        pointsUntilFree: {type: Number}
    },
    attributes: {
        pioneer: {type: Number, default: 0},
        diplomat: {type: Number, default: 0},
        evaluator: {type: Number, default: 0},
        gourmet: {type: Number, default: 0}
    }
});

personSchema.pre('save', function(next) {
    var user = this;

    if (this.isUser()) {
        _.each(['fullName', 'nickname', 'email', 'team'], function(key) {
            if (typeof user[key] === 'undefined') {
                return next(new Error('Required field ' + key + ' missing for Person of type user.'));
            }
        });
    }

    async.series([
        function(cb) {
            // Only hash the password if it has been modified (or is new)
            if (user.isModified('password')) {
                bcrypt.hash(user.password, BCRYPT_WORK_FACTOR, function(err, hash) {
                    if (err) {
                        return next(err);
                    }

                    // override the cleartext password with the hashed one
                    user.password = hash;
                    cb();
                });
            }
            else {
                cb();
            }
        },
        function() {
            if (user.isModified('resetPasswordToken') && user.resetPasswordToken) {
                // Override the cleartext token with the hashed one
                user.resetPasswordToken = cryptoUtils.hashResetToken(user.resetPasswordToken);
            }
            return next();
        }
    ]);
})
;

personSchema.methods.verify = function(candidatePassword, next) {
    bcrypt.compare(candidatePassword, this.password, next);
};


personSchema.methods.populateActivityLinks = function(next) {
    var that = this;
    ActivityLink.find()
        .or([{source: that.id}, {target: that.id}])
        .populate('source target')
        .exec(function(err, activityLinks) {
            if (err) {
                return next(err);
            }
            that._activityLinks = activityLinks;
            return next(null);
        });
};

personSchema.methods.isUser = function() {
    return (typeof this.password !== 'undefined');
};

personSchema.methods.getType = function() {
    if (typeof(this._activityLinks) === 'undefined') {
        throw 'Must call populateActivityLinks before calling getType';
    }

    if (this.isUser()) {
        return 'user';
    }
    else if (_.some(this._activityLinks, 'completedAt')) {
        return 'baby';
    }
    else {
        return 'maybe';
    }
};

personSchema.methods.notifyMissionCompleted = function(mission, next) {
    var that = this;
    var INC = 1;
    var PIONEER_INC = INC;
    var DIPLOMAT_INC = INC;
    var EVALUATOR_INC = INC;
    var GOURMET_INC = INC;

    var pioneerInc = 0;
    var diplomatInc = 0;
    var evaluatorInc = 0;
    var gourmetInc = 0;

    var missionType = mission.getType();

    if(missionType === 'AddLocationMission' ||
        missionType === 'WhatOptionsMission'){
        pioneerInc += PIONEER_INC;
    }

    if(mission.isFirstOfType &&
        (missionType === 'VisitBonusMission' ||
            missionType === 'HasOptionsMission' ||
            missionType === 'WantVeganMission' ||
            missionType === 'WhatOptionsMission' ||
            missionType === 'RateOptionsMission' ||
            missionType === 'OfferQualityMission' ||
            missionType === 'EffortValueMission')) {
        pioneerInc += PIONEER_INC;
    }

    if(missionType === 'HasOptionsMission' ||
        missionType === 'WantVeganMission' ||
        missionType === 'GiveFeedbackMission'){
        diplomatInc = DIPLOMAT_INC;
    }

    if(missionType === 'RateOptionsMission' ||
        missionType === 'OfferQualityMission' ||
        missionType === 'EffortValueMission'){
        evaluatorInc = EVALUATOR_INC;
    }

    if(missionType === 'VisitBonusMission' ||
        missionType === 'BuyOptionsMission'){
        gourmetInc = GOURMET_INC;
    }
    that.attributes.pioneer += pioneerInc;
    that.attributes.diplomat += diplomatInc;
    that.attributes.evaluator += evaluatorInc;
    that.attributes.gourmet += gourmetInc;
    that.save(next);
};

/**
 * toJSON transform method is automatically called when converting a person
 * to JSON (as before sending it over the API)
 * @type {{transform: Function}}
 */
personSchema.options.toJSON = {
    transform: function(doc) {
        // Pick basic properties
        var ret = _.pick(doc,
            'id', 'email', 'nickname', 'fullName', 'gender', 'locale',
            'dateOfBirth', 'phone', 'address', 'team', 'attributes'
        );

        // Attach capture if it has been loaded
        if (typeof doc.capture.active !== 'undefined') {
            ret.capture = doc.capture;
        }

        // Add type if the activity links have been loaded
        if (doc._activityLinks) {
            ret.type = doc.getType();
        }

        return ret;
    }
};

mongoose.model('Person', personSchema);
