/**
 * FixtureCreator class for easily creating a set of fixtures for tests.
 */
'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var activities = require('./activities');

var Person = mongoose.model('Person');
var ActivityLink = mongoose.model('ActivityLink');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

/**
 * FixtureCreator constructor. Helper for creating fixtures.
 * Will add the Activity fixtures by default.
 * @param fixtures
 * @constructor
 */
var FixtureCreator = function(fixtures) {
    this._fixtures = fixtures || {};

    // Add the basic activities if not set yet
    _.defaults(this._fixtures, activities.getFixtures());
};

// Converts an integer into a mongoose-style object id.
var intToId = function(id) {
    var result = id.toString(16);
    while (result.length < 24) {
        result = ' ' + result;
    }
    return result;
};

var capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Adds a user to the fixtures
 *
 * @param {string} name
 * @param {string} [team]
 * @param {string} [role]
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.user = function(name, team, role) {
    // Assign random values when they are not provided
    if (typeof team === 'undefined') {
        team = (Math.random() < 0.5) ? 'blue' : 'green';
    }

    if (typeof role === 'undefined') {
        var rand = Math.random();
        if (rand < 0.33) {
            role = 'rookie';
        }
        else if (rand < 0.67) {
            role = 'scout';
        }
        else {
            role = 'veteran';
        }
    }

    this._fixtures[name] = new Person({
        _id: intToId(_.size(this._fixtures)),
        email: name + '@example.com',
        password: name,
        fullName: capitalize(name) + ' Example',
        team: team,
        role: role
    });

    return this;
};

/**
 * Adds a 'maybe' to the fixtures
 *
 * @param {string} name
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.maybe = function(name) {
    this._fixtures[name] = new Person({
        _id: intToId(_.size(this._fixtures)),
        fullName: capitalize(name) + ' the Maybe'
    });

    return this;
};

/**
 * Adds an activity link to the fixtures
 * @param {string} source Name of the source
 * @param {string} target Name of the target
 * @param {boolean} [success=true]
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.activityLink = function(source, target, success) {
    // Set default value
    if (typeof success === 'undefined') {
        success = true;
    }
    var linkName = source + 'DoesSomethingFor' + capitalize(target);
    var suffix = 0;

    // There can be multiple links between the same pair of people
    while (_.has(this._fixtures, linkName)) {
        suffix += 1;
        linkName = linkName.replace(/\d+$/, '') + suffix;
    }

    this._fixtures[linkName] = new ActivityLink({
        activity: this._fixtures.buyActivity.id,
        source: this._fixtures[source].id,
        target: this._fixtures[target].id,
        success: success,
        referenceCode: linkName
    });

    return this;
};

FixtureCreator.prototype.location = function (user, name, coordinates, type) {
    this._fixtures[name] = new Location({
        _id: intToId(_.size(this._fixtures)),
        name: name,
        coordinates: coordinates,
        type: type
    });

    this._fixtures[name + 'FirstVisit'] = new Visit({
        person: this._fixtures[user].id,
        location: this._fixtures[name],
        completed: new Date(),
        missions: [{
            type: 'addLocation',
            outcome: true
        }]
    });
};

FixtureCreator.prototype.getFixtures = function() {
    return this._fixtures;
};

FixtureCreator.prototype.setupFixtures = function(done) {
    FixtureLoader.load(this._fixtures, done);
};

exports.FixtureCreator = FixtureCreator;
