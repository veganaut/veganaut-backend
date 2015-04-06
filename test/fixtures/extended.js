/**
 * A generic extended set of fixtures
 */
'use strict';

var mongoose = require('mongoose');
var FixtureCreator = require('./FixtureCreator');
var referenceCodes = require('./referenceCodes');

var getFixtures = function() {
    var fix = new FixtureCreator(referenceCodes.getFixtures());

    // As a mnemonic, we have guys in the team2 and girls in the team1
    fix.user('george', 'team2');
    fix.user('harry', 'team2');
    fix.user('isaac', 'team2');
    fix.user('king', 'team2');
    fix.user('louie', 'team2');
    fix.user('mary', 'team1');
    fix.user('nellie', 'team1');
    fix.user('olivia', 'team1');
    fix.user('paula', 'team1');
    fix.user('nova', 'team1');

    // A few maybes
    fix.maybe('vanessa');
    fix.maybe('william');
    fix.maybe('xymna');
    fix.maybe('yana');
    fix.maybe('zachary');

    // Let's create a clique between George, Harry and Isaac
    fix.activityLink('george', 'harry', true);
    fix.activityLink('george', 'isaac', true);
    fix.activityLink('harry', 'george', true);
    fix.activityLink('harry', 'isaac', true);
    fix.activityLink('isaac', 'george', true);
    fix.activityLink('isaac', 'harry', true);

    fix.activityLink('isaac', 'king', true);
    fix.activityLink('isaac', 'louie', false);
    fix.activityLink('king', 'louie', true);
    fix.activityLink('louie', 'isaac', true);

    fix.activityLink('king', 'mary', false);
    fix.activityLink('king', 'nellie', true);

    fix.activityLink('mary', 'nellie', true);
    fix.activityLink('mary', 'olivia', true);
    fix.activityLink('nellie', 'olivia', true);
    fix.activityLink('nellie', 'mary', true);

    // George seems to be quite popular with the girls (and captured by their team)
    fix.activityLink('mary', 'george', true);
    fix.activityLink('nellie', 'george', true);
    fix.activityLink('olivia', 'george', true);
    fix.activityLink('olivia', 'george', true);
    fix.activityLink('paula', 'george', true);
    fix.activityLink('paula', 'george', true);
    fix.activityLink('paula', 'george', true);

    // Some activity links towards maybes
    fix.activityLink('isaac', 'vanessa', false);
    fix.activityLink('louie', 'william', false);
    fix.activityLink('louie', 'william', false);
    fix.activityLink('mary', 'xymna', false);
    fix.activityLink('paula', 'yana', false);
    fix.activityLink('olivia', 'zachary', false);

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function (done) {
    getFixtures().setupFixtures(done);
};
exports.setupFixtures = setupFixtures;


if (require.main === module) {
    mongoose.connect('mongodb://localhost/veganaut', function(err) {
        if (err) {
            console.log('Could not connect to Mongo: ', err);
            process.exit();
        }
        setupFixtures(function() {
            mongoose.disconnect();
        });
    });
}
