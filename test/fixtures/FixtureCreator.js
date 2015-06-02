/**
 * FixtureCreator class for easily creating a set of fixtures for tests.
 */
'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var constants = require('../../app/utils/constants');
var FixtureLoader = require('./FixtureLoader');
var activities = require('./activities');
var Missions = require('../../app/models/Missions');
var Product = require('../../app/models/Product');

var Person = mongoose.model('Person');
var ActivityLink = mongoose.model('ActivityLink');
var Location = mongoose.model('Location');

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
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.user = function(name, team) {
    // Assign random values when they are not provided
    if (typeof team === 'undefined') {
        team = _.sample(constants.PLAYER_TEAMS);
    }

    this._fixtures[name] = new Person({
        _id: intToId(_.size(this._fixtures)),
        email: name + '@example.com',
        password: name,
        nickname: capitalize(name),
        fullName: capitalize(name) + ' Example',
        team: team
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
        nickname: capitalize(name)
    });

    return this;
};

/**
 * Adds an activity link to the fixtures
 * @param {string} source Name of the source
 * @param {string} target Name of the target
 * @param {boolean} [completed=true] Whether the link is completed
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.activityLink = function(source, target, completed) {
    // Set default value
    var completedAt;
    if (typeof completed === 'undefined' || completed === true) {
        completedAt = Date.now();
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
        completedAt: completedAt,
        referenceCode: linkName
    });

    return this;
};

FixtureCreator.prototype.location = function(user, name, coordinates, type) {
    this._fixtures[name] = new Location({
        _id: intToId(_.size(this._fixtures)),
        name: name,
        coordinates: coordinates,
        type: type
    });

    this._fixtures[name + 'FirstMission'] = new Missions.AddLocationMission({
        person: this._fixtures[user].id,
        location: this._fixtures[name],
        completed: new Date(),
        outcome: true
    });

    return this;
};

FixtureCreator.prototype.product = function(location, name) {
    this._fixtures['product.' + name] = new Product({
        _id: intToId(_.size(this._fixtures)),
        location: this._fixtures[location].id,
        name: name
    });

    return this;
};

FixtureCreator.prototype.getFixtures = function() {
    return this._fixtures;
};

FixtureCreator.prototype.setupFixtures = function(done) {
    FixtureLoader.load(this._fixtures, done);
};

module.exports = FixtureCreator;
