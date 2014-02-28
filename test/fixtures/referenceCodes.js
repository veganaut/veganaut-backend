/**
 * Fixtures for the referenceCodes.spec.js e2e tests
 */
'use strict';

var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var basic = require('./basic');

require('../../app/models/Person');
require('../../app/models/Activity');
require('../../app/models/ActivityLink');
require('../../app/models/GraphNode');
var Person = mongoose.model('Person');

var getFixtures = function() {
    var fix = basic.getFixtures();

    fix.frank = new Person({
        _id: '000000000000000000000006',
        email: 'frank@frank.fr',
        password: 'frank',
        fullName: 'Frank Frankster'
    });

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function (done) {
    FixtureLoader.load(getFixtures(), done);
};
exports.setupFixtures = setupFixtures;
