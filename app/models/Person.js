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
var config = require('../config');

var bcrypt = require('bcrypt');
var BCRYPT_WORK_FACTOR = 10;
var cryptoUtils = require('../utils/cryptoUtils');


var personSchema = new Schema({
    email: {type: String, unique: true, sparse: true, required: true},
    password: {type: String, required: true},
    nickname: {type: String, required: true},

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    fullName: {type: String, required: true},
    // dateOfBirth can be just a year, year-month, or year-month-day
    dateOfBirth: {type: String, matches: /^\d{4}(?:-\d\d){0,2}$/},

    phone: String,
    address: String,
    gender: {type: String, enum: ['male', 'female', 'other']},
    locale: {type: String, default: config.locale.default, enum: config.locale.available},

    team: {type: String, enum: constants.ALL_TEAMS},
    attributes: {
        pioneer: {type: Number, default: 0},
        diplomat: {type: Number, default: 0},
        evaluator: {type: Number, default: 0},
        gourmet: {type: Number, default: 0}
    }
});

personSchema.pre('save', function(next) {
    var user = this;

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

/**
 * Method will be called every time a mission is completed.
 * Updates this person's attributes based on the passed mission
 * @param mission
 * @param next
 */
personSchema.methods.notifyMissionCompleted = function(mission, next) {
    // TODO: the mission model should know how it affects the attributes
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

    if (missionType === 'AddLocationMission' ||
        missionType === 'WhatOptionsMission')
    {
        pioneerInc += PIONEER_INC;
    }

    if (mission.isFirstOfType &&
        (missionType === 'VisitBonusMission' ||
        missionType === 'HasOptionsMission' ||
        missionType === 'WantVeganMission' ||
        missionType === 'WhatOptionsMission' ||
        missionType === 'RateProductMission' ||
        missionType === 'OfferQualityMission' ||
        missionType === 'EffortValueMission'))
    {
        pioneerInc += PIONEER_INC;
    }

    if (missionType === 'HasOptionsMission' ||
        missionType === 'WantVeganMission' ||
        missionType === 'GiveFeedbackMission')
    {
        diplomatInc = DIPLOMAT_INC;
    }

    if (missionType === 'RateProductMission' ||
        missionType === 'OfferQualityMission' ||
        missionType === 'EffortValueMission' ||
        missionType === 'SetProductNameMission' ||
        missionType === 'SetProductAvailMission')
    {
        evaluatorInc = EVALUATOR_INC;
    }

    if (missionType === 'VisitBonusMission' ||
        missionType === 'BuyOptionsMission')
    {
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
            'dateOfBirth', 'phone', 'address', 'team'
        );

        // Attach attributes if they have been loaded
        // TODO: there should be a better way of checking whether that was loaded
        if (typeof doc.attributes.pioneer !== 'undefined' ||
            typeof doc.attributes.diplomat !== 'undefined' ||
            typeof doc.attributes.evaluator !== 'undefined' ||
            typeof doc.attributes.gourmet !== 'undefined')
        {
            ret.attributes = doc.attributes;
        }

        return ret;
    }
};

mongoose.model('Person', personSchema);
