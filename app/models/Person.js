/**
 * Mongoose schema for a person.
 *
 * Password hashing inspired by http://blog.mongodb.org/post/32866457221/password-authentication-with-mongoose-part-1
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcrypt');
var BCRYPT_WORK_FACTOR = 10;

function generateAlienName() {
    return 'Zorg-' + ((1000000 * Math.random()).toFixed(0));
}

var PersonSchema = new Schema({
    email: {type: String, unique: true},
    password: String,
    alienName: { type: String, default: generateAlienName },

    fullName: String,
    // dateOfBirth can be just a year, year-month, or year-month-day
    dateOfBirth: {type: String, matches: /^\d{4}(?:-\d\d){0,2}$/},

    phone: String,
    address: String,
    gender: {type: String, enum: ['male', 'female', 'other']},
    locale: {type: String, default: 'en'},

    team: {type: String, enum: ['blue', 'green', 'neutral'], default: 'neutral'}
});

PersonSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) { return next(); }

    bcrypt.hash(user.password, BCRYPT_WORK_FACTOR, function(err, hash) {
        if (err) { return next(err); }

        // override the cleartext password with the hashed one
        user.password = hash;
        next();
    });
});

PersonSchema.methods.verify = function(candidatePassword, next) {
    bcrypt.compare(candidatePassword, this.password, next);
};

mongoose.model('Person', PersonSchema);
