/**
 * Basic test fixtures
 */
'use strict';

var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');

var Activity = mongoose.model('Activity');

var getFixtures = function() {
    var fix = {};
    fix.buyActivity = new Activity({
        _id: 'a00000000000000000000001',
        name: 'Buy something vegan for ...',
        className: 'Shopping'
    });

    fix.cookActivity = new Activity({
        _id: 'a00000000000000000000002',
        name: 'Cook something vegan for ...',
        className: 'Cooking'
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
