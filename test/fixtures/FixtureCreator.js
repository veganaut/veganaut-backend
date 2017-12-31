/**
 * FixtureCreator class for easily creating a set of fixtures for tests.
 */
'use strict';

var _ = require('lodash');
var db = require('../../app/models');
var FixtureLoader = require('./FixtureLoader');

/**
 * FixtureCreator constructor. Helper for creating fixtures.
 * @param fixtures
 * @constructor
 */
var FixtureCreator = function(fixtures) {
    this._lastId = 1000;
    this._fixtures = fixtures || {};
};

/**
 * Returns the id to be used for the next fixture element
 * @returns {number}
 * @private
 */
FixtureCreator.prototype._getNextId = function() {
    this._lastId += 1;
    return this._lastId;
};

/**
 * Adds a user to the fixtures
 *
 * @param {string} name
 * @returns {FixtureCreator}
 */
FixtureCreator.prototype.user = function(name) {
    this._fixtures[name] = db.Person.build({
        id: this._getNextId(),
        email: name + '@example.com',
        password: name,
        nickname: _.capitalize(name)
    });

    return this;
};

FixtureCreator.prototype.location = function(user, name, coordinates, type) {
    this._fixtures[name] = db.Location.build({
        id: this._getNextId(),
        name: name,
        coordinates: {
            type: 'Point',
            coordinates: coordinates
        },
        type: type
    });

    this._fixtures[name + 'FirstTask'] = db.Task.build({
        type: 'AddLocation',
        personId: this._fixtures[user].id,
        locationId: this._fixtures[name].id,
        outcome: {
            locationAdded: true
        }
    });

    return this;
};

FixtureCreator.prototype.product = function(location, name) {
    this._fixtures['product.' + name] = db.Product.build({
        id: this._getNextId(),
        locationId: this._fixtures[location].id,
        name: name
    });

    return this;
};

FixtureCreator.prototype.getFixtures = function() {
    return this._fixtures;
};

FixtureCreator.prototype.setupFixtures = function() {
    return FixtureLoader.load(this._fixtures);
};

module.exports = FixtureCreator;
