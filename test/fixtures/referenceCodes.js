/**
 * Fixtures for the referenceCodes.spec.js e2e tests
 */
'use strict';

var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var basic = require('./basic');
var Person = mongoose.model('Person');

var getFixtures = function() {
    var fix = basic.getFixtures();

    fix.frank = new Person({
        _id: '000000000000000000000006',
        email: 'frank@frank.fr',
        password: 'frank',
        team: 'green',
        role: 'rookie',
        fullName: 'Frank Frankster'
    });

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function (done) {
    FixtureLoader.load(getFixtures(), done);
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
