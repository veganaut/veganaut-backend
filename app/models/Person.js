/**
 * Mongoose schema for a person.
 *
 * Password hashing inspired by http://blog.mongodb.org/post/32866457221/password-authentication-with-mongoose-part-1
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../constants');

require('./ActivityLink');
var ActivityLink = mongoose.model('ActivityLink');

var bcrypt = require('bcrypt');
var BCRYPT_WORK_FACTOR = 10;

// Constants used in strength and hits computation
var INNATE_STRENGTH = {rookie: 1, scout: 3, veteran: 10, nonUser: 0.5};
var MULTIPLE_LINKS_FACTOR = 0.5;

function generateNickname() {
    return 'Veganaut-' + ((1000000 * Math.random()).toFixed(0));
}

var personSchema = new Schema({
    email: {type: String, unique: true, sparse: true},
    password: String,
    nickname: { type: String, default: generateNickname },

    fullName: String,
    // dateOfBirth can be just a year, year-month, or year-month-day
    dateOfBirth: {type: String, matches: /^\d{4}(?:-\d\d){0,2}$/},

    phone: String,
    address: String,
    gender: {type: String, enum: ['male', 'female', 'other']},
    locale: {type: String, default: 'en'},

    team: {type: String, enum: constants.TEAMS},
    role: {type: String, enum: ['rookie', 'scout', 'veteran'], default: 'rookie'}
});

personSchema.pre('save', function(next) {
    var user = this;

    if (this.isUser()) {
        _.each(['fullName', 'role', 'email', 'team'], function (key) {
            if (typeof user[key] === 'undefined') {
                return next(new Error('Required field ' + key + ' missing for Person of type user.'));
            }
        });
    }

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) { return next(); }

    bcrypt.hash(user.password, BCRYPT_WORK_FACTOR, function(err, hash) {
        if (err) { return next(err); }

        // override the cleartext password with the hashed one
        user.password = hash;
        next();
    });
});

personSchema.methods.verify = function(candidatePassword, next) {
    bcrypt.compare(candidatePassword, this.password, next);
};

personSchema.methods.populateActivityLinks = function(next) {
    var that = this;
    ActivityLink.find()
        .or([{source: that.id}, {target: that.id}])
        .populate('source target')
        .exec(function(err, activityLinks) {
            if (err) { return next(err); }
            that._activityLinks = activityLinks;
            return next(null);
        });
};

personSchema.methods.isUser = function() {
    return typeof this.password !== 'undefined';
};

personSchema.methods.getType = function() {
    if (typeof(this._activityLinks) === 'undefined') {
        throw 'Must call populateActivityLinks before calling getType';
    }

    if (this.isUser()) {
        return 'user';
    } else if (_.some(this._activityLinks, 'success')) {
        return 'baby';
    } else {
        return 'maybe';
    }
};

personSchema.methods.isCaptured = function() {
    return (this.getHits() >= this.getStrength());
};

// Computes the strength of a person.
//
// A person has an innate strength depending on their role. It also gets
// strength from every activity link for which it is a source, and from every
// incoming activity link of a teammate.
//
// Multiple activity links between the same pair of people give decreasing
// amounts of strength. The first link has a value of 1, the second
// MULTIPLE_LINKS_FACTOR, the third MULTIPLE_LINKS_FACTOR**2, etc.
personSchema.methods.getStrength = function() {
    if (typeof(this._activityLinks) === 'undefined') {
        throw 'Must call populateActivityLinks before calling getStrength';
    }

    var that = this;

    var innateStrengthType = that.isUser() ? that.role : 'nonUser';
    var strength = INNATE_STRENGTH[innateStrengthType];
    var successfulActivityLinks = _.filter(that._activityLinks, 'success');
    var nLinksByOther = {};
    _.forEach(successfulActivityLinks, function(al) {
        var otherId = (al.source.id === that.id) ? al.target.id : al.source.id;
        nLinksByOther[otherId] = (nLinksByOther[otherId] || 0) + 1;
        var activityLinkValue = Math.pow(MULTIPLE_LINKS_FACTOR, nLinksByOther[otherId] - 1);

        if (al.source.id === that.id) {
            strength += activityLinkValue;
        } else {
            if (al.source.team === that.team) {
                strength += activityLinkValue;
            }
        }
    });

    return strength;
};

// Computes the hits of a person.
//
// A person incurs hits when a member of the opponent team creates an activity
// link.
//
// Multiple activity links between the same pair of people give decreasing
// amounts of hit points, just like for strength.
personSchema.methods.getHits = function() {
    if (typeof(this._activityLinks) === 'undefined') {
        throw 'Must call populateActivityLinks before calling getHits';
    }

    var that = this;

    var hits = 0;
    var successfulActivityLinks = _.filter(that._activityLinks, 'success');
    var nLinksByOther = {};
    _.forEach(successfulActivityLinks, function(al) {
        var otherId = (al.source.id === that.id) ? al.target.id : al.source.id;
        nLinksByOther[otherId] = (nLinksByOther[otherId] || 0) + 1;
        var activityLinkValue = Math.pow(MULTIPLE_LINKS_FACTOR, nLinksByOther[otherId] - 1);

        if (al.source.id !== that.id && al.source.team !== that.team) {
            hits += activityLinkValue;
        }
    });

    return hits;
};

/**
 * Returns this person ready to be sent to the frontend
 * @returns {{}}
 * @returns {Object}
 * TODO: this should be toJSON instead, it's called automatically
 */
personSchema.methods.toApiObject = function () {
    return _.assign(
        _.pick(this, 'email', 'nickname', 'fullName', 'gender', 'dateOfBirth', 'phone', 'address', 'team', 'role'),
        {
            id:         this.id,
            type:       this.getType(),
            strength:   this.getStrength(),
            hits:       this.getHits(),
            isCaptured: this.isCaptured()
        }
    );
};

mongoose.model('Person', personSchema);
