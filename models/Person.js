/**
 * Mongoose schema for a person
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateAlienName() {
    return 'Zorg-' + ((1000000 * Math.random()).toFixed(0));
}

var PersonSchema = new Schema({
    email: String,
    password: String,
    alienName: {type: String, default: generateAlienName()},

    firstName: String,
    lastName: String,
    // dateOfBirth can be just a year, year-month, or year-month-day
    dateOfBirth: {type: String, matches: /^\d{4}(?:-\d\d){0,2}$/},

    phone: String,
    address: String,
    gender: {type: String, enum: ['male', 'female', 'other']},
    locale: {type: String, default: 'en'}
});

exports.Person = mongoose.model('Person', PersonSchema);