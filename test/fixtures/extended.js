/**
 * A generic extended set of fixtures
 */
'use strict';

var mongoose = require('mongoose');
var FixtureCreator = require('./FixtureCreator').FixtureCreator;
var referenceCodes = require('./referenceCodes');

var getFixtures = function() {
    var fix = new FixtureCreator(referenceCodes.getFixtures());

    // As a mnemonic, we have guys in the green team and girls in the blue
    // team.
    fix.addPerson('george', 'green', 'rookie');
    fix.addPerson('harry', 'green', 'scout');
    fix.addPerson('isaac', 'green', 'veteran');
    fix.addPerson('king', 'green', 'rookie');
    fix.addPerson('louie', 'green', 'scout');
    fix.addPerson('mary', 'blue', 'rookie');
    fix.addPerson('nellie', 'blue', 'scout');
    fix.addPerson('olivia', 'blue', 'veteran');
    fix.addPerson('paula', 'blue', 'rookie');
    fix.addPerson('nova', 'blue', 'rookie');

    // A few maybes
    fix.addMaybe('vanessa');
    fix.addMaybe('william');
    fix.addMaybe('xymna');
    fix.addMaybe('yana');
    fix.addMaybe('zachary');

    // Let's create a clique between George, Harry and Isaac
    fix.addActivityLink('george', 'harry', true);
    fix.addActivityLink('george', 'isaac', true);
    fix.addActivityLink('harry', 'george', true);
    fix.addActivityLink('harry', 'isaac', true);
    fix.addActivityLink('isaac', 'george', true);
    fix.addActivityLink('isaac', 'harry', true);

    fix.addActivityLink('isaac', 'king', true);
    fix.addActivityLink('isaac', 'louie', false);
    fix.addActivityLink('king', 'louie', true);
    fix.addActivityLink('louie', 'isaac', true);

    fix.addActivityLink('king', 'mary', false);
    fix.addActivityLink('king', 'nellie', true);

    fix.addActivityLink('mary', 'nellie', true);
    fix.addActivityLink('mary', 'olivia', true);
    fix.addActivityLink('nellie', 'olivia', true);
    fix.addActivityLink('nellie', 'mary', true);

    // George seems to be quite popular with the girls (and captured by their team)
    fix.addActivityLink('mary', 'george', true);
    fix.addActivityLink('nellie', 'george', true);
    fix.addActivityLink('olivia', 'george', true);
    fix.addActivityLink('olivia', 'george', true);
    fix.addActivityLink('paula', 'george', true);
    fix.addActivityLink('paula', 'george', true);
    fix.addActivityLink('paula', 'george', true);

    // Some activity links towards maybes
    fix.addActivityLink('isaac', 'vanessa', false);
    fix.addActivityLink('louie', 'william', false);
    fix.addActivityLink('louie', 'william', false);
    fix.addActivityLink('mary', 'xymna', false);
    fix.addActivityLink('paula', 'yana', false);
    fix.addActivityLink('olivia', 'zachary', false);

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function (done) {
    getFixtures().setupFixtures(done);
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
