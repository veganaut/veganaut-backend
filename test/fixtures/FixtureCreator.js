/**
 * FixtureCreator class for easily creating a set of fixtures for tests.
 */
'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');

var Person = mongoose.model('Person');
var ActivityLink = mongoose.model('ActivityLink');
var GraphNode = mongoose.model('GraphNode');

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

FixtureCreator.prototype.addPerson = function(name, team, role) {
    this._fixtures[name] = new Person({
        _id: intToId(_.size(this._fixtures)),
        email: name + '@example.com',
        password: name,
        fullName: capitalize(name) + ' Example',
        team: team,
        role: role
    });
};

FixtureCreator.prototype.addMaybe = function(name) {
    this._fixtures[name] = new Person({
        _id: intToId(_.size(this._fixtures)),
        fullName: name.charAt(0).toUpperCase() + name.slice(1) + ' the Maybe'
    });
};

FixtureCreator.prototype.addActivityLink = function(source, target, success) {
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

    // Ensure that the corresponding graph nodes exist
    var graphNodeName = source + 'Knows' + capitalize(target);
    if (!this._fixtures[graphNodeName]) {
        this._fixtures[graphNodeName] = new GraphNode({
            owner: this._fixtures[source].id,
            target: this._fixtures[target].id
        });
    }
    var reverseGraphNodeName = target + 'Knows' + capitalize(source);
    if (success && !this._fixtures[reverseGraphNodeName]) {
        this._fixtures[reverseGraphNodeName] = new GraphNode({
            owner: this._fixtures[target].id,
            target: this._fixtures[source].id
        });
    }
};

FixtureCreator.prototype.setupFixtures = function(done) {
    FixtureLoader.load(this._fixtures, done);
};

exports.FixtureCreator = FixtureCreator;
