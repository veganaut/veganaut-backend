/**
 * FixtureCreator class for easily creating a set of fixtures for tests.
 */
'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var Missions = require('../../app/models/Missions');
var Product = require('../../app/models/Product');

var Person = mongoose.model('Person');
var Location = mongoose.model('Location');

/**
 * FixtureCreator constructor. Helper for creating fixtures.
 * @param fixtures
 * @constructor
 */
var FixtureCreator = function(fixtures) {
    this._fixtures = fixtures || {};
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
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.user = function(name) {
    this._fixtures[name] = new Person({
        _id: intToId(_.size(this._fixtures)),
        email: name + '@example.com',
        password: name,
        nickname: capitalize(name),
        fullName: capitalize(name) + ' Example'
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
