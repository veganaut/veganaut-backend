/**
 * A generic extended set of fixtures
 */
'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var referenceCodes = require('./referenceCodes');

require('../../app/models/Person');
require('../../app/models/ActivityLink');
require('../../app/models/GraphNode');
var Person = mongoose.model('Person');
var ActivityLink = mongoose.model('ActivityLink');
var GraphNode = mongoose.model('GraphNode');

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

var addPerson = function(fix, name, team, role) {
    fix[name] = new Person({
        _id: intToId(_.size(fix)),
        email: name + '@example.com',
        password: name,
        fullName: capitalize(name) + ' Example',
        team: team,
        role: role
    });
};

var addMaybe = function(fix, name) {
    fix[name] = new Person({
        _id: intToId(_.size(fix)),
        fullName: name.charAt(0).toUpperCase() + name.slice(1) + ' the Maybe'
    });
};

var addActivityLink = function(fix, source, target, success) {
    var linkName = source + 'DoesSomethingFor' + capitalize(target);
    var suffix = 0;

    // There can be multiple links between the same pair of people
    while (_.has(fix, linkName)) {
        suffix += 1;
        linkName = linkName.replace(/\d+$/, '') + suffix;
    }

    fix[linkName] = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix[source].id,
        target: fix[target].id,
        location: 'South-west spiral arm of the Milky Way',
        startDate: '2014-03-30',
        success: success,
        referenceCode: linkName
    });

    // Ensure that the corresponding graph nodes exist
    var graphNodeName = source + 'Knows' + capitalize(target);
    if (!fix[graphNodeName]) {
        fix[graphNodeName] = new GraphNode({
            owner: fix[source].id,
            target: fix[target].id
        });
    }
    var reverseGraphNodeName = target + 'Knows' + capitalize(source);
    if (success && !fix[reverseGraphNodeName]) {
        fix[reverseGraphNodeName] = new GraphNode({
            owner: fix[target].id,
            target: fix[source].id
        });
    }
};

var getFixtures = function() {
    var fix = referenceCodes.getFixtures();

    // As a mnemonic, we have guys in the green team and girls in the blue
    // team.
    addPerson(fix, 'george', 'green', 'rookie');
    addPerson(fix, 'harry', 'green', 'scout');
    addPerson(fix, 'isaac', 'green', 'veteran');
    addPerson(fix, 'king', 'green', 'rookie');
    addPerson(fix, 'louie', 'green', 'scout');
    addPerson(fix, 'mary', 'blue', 'rookie');
    addPerson(fix, 'nellie', 'blue', 'scout');
    addPerson(fix, 'olivia', 'blue', 'veteran');
    addPerson(fix, 'paula', 'blue', 'rookie');
	addPerson(fix, 'nova', 'blue', 'rookie');

    // A few maybes
    addMaybe(fix, 'vanessa');
    addMaybe(fix, 'william');
    addMaybe(fix, 'xymna');
    addMaybe(fix, 'yana');
    addMaybe(fix, 'zachary');

    // Let's create a clique between George, Harry and Isaac
    addActivityLink(fix, 'george', 'harry', true);
    addActivityLink(fix, 'george', 'isaac', true);
    addActivityLink(fix, 'harry', 'george', true);
    addActivityLink(fix, 'harry', 'isaac', true);
    addActivityLink(fix, 'isaac', 'george', true);
    addActivityLink(fix, 'isaac', 'harry', true);

    addActivityLink(fix, 'isaac', 'king', true);
    addActivityLink(fix, 'isaac', 'louie', false);
    addActivityLink(fix, 'king', 'louie', true);
    addActivityLink(fix, 'louie', 'isaac', true);

    addActivityLink(fix, 'king', 'mary', false);
    addActivityLink(fix, 'king', 'nellie', true);

    addActivityLink(fix, 'mary', 'nellie', true);
    addActivityLink(fix, 'mary', 'olivia', true);
    addActivityLink(fix, 'nellie', 'olivia', true);
    addActivityLink(fix, 'nellie', 'mary', true);

    // George seems to be quite popular with the girls (and captured by their team)
    addActivityLink(fix, 'mary', 'george', true);
    addActivityLink(fix, 'nellie', 'george', true);
    addActivityLink(fix, 'olivia', 'george', true);
    addActivityLink(fix, 'olivia', 'george', true);
    addActivityLink(fix, 'paula', 'george', true);
    addActivityLink(fix, 'paula', 'george', true);
    addActivityLink(fix, 'paula', 'george', true);

    // Some activity links towards maybes
    addActivityLink(fix, 'isaac', 'vanessa', false);
    addActivityLink(fix, 'louie', 'william', false);
    addActivityLink(fix, 'louie', 'william', false);
    addActivityLink(fix, 'mary', 'xymna', false);
    addActivityLink(fix, 'paula', 'yana', false);
    addActivityLink(fix, 'olivia', 'zachary', false);

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function (done) {
    FixtureLoader.load(getFixtures(), done);
};
exports.setupFixtures = setupFixtures;


if (require.main === module) {
    mongoose.connect('mongodb://localhost/monkey', function(err) {
        if (err) {
            console.log('Could not connect to Mongo: ', err);
            process.exit();
        }
        setupFixtures(function() {
            mongoose.disconnect();
        });
    });
}
