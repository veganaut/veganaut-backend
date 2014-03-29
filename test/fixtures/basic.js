/**
 * Basic test fixtures
 */
'use strict';

var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');

require('../../app/models/Person');
require('../../app/models/Activity');
require('../../app/models/ActivityLink');
require('../../app/models/GraphNode');
var Person = mongoose.model('Person');
var Activity = mongoose.model('Activity');
var ActivityLink = mongoose.model('ActivityLink');
var GraphNode = mongoose.model('GraphNode');

var getFixtures = function() {
    var fix = {};
    fix.alice = new Person({
        _id: '000000000000000000000001',
        email: 'foo@bar.baz',
        password: 'foobar',
        team: 'blue',
        role: 'veteran',
        fullName: 'Alice Alison'
    });

    fix.bob = new Person({
        _id: '000000000000000000000002',
        email: 'im@stoop.id',
        password: 'bestpasswordever',
        team: 'green',
        fullName: 'Bob Burton',
        role: 'scout',
        gender: 'male'
    });

    fix.carol = new Person({
        _id: '000000000000000000000003',
        team: 'blue',
        fullName: 'Carol'
    });

    fix.dave = new Person({
        _id: '000000000000000000000004',
        team: 'blue',
        fullName: 'Dave Donaldsson'
    });

    fix.eve = new Person({
        _id: '000000000000000000000005',
        team: 'green',
        fullName: 'Eve'
    });


    fix.buyActivity = new Activity({
        _id: 'a00000000000000000000001',
        name: 'Buy something vegan for ...',
        className: 'Shopping',
        givesVegBytes: false
    });

    fix.cookActivity = new Activity({
        _id: 'a00000000000000000000002',
        name: 'Cook something vegan for ...',
        className: 'Cooking',
        givesVegBytes: true
    });


    fix.aliceBuysSomethingForBob = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix.alice.id,
        target: fix.bob.id,
        location: 'Bern, Switzerland',
        startDate: '2014-01-10',
        success: true,
        referenceCode: 'Ff8tEQ'
    });

    fix.aliceCooksSomethingForCarol = new ActivityLink({
        activity: fix.cookActivity.id,
        source: fix.alice.id,
        target: fix.carol.id,
        location: 'Bern',
        startDate: '2014-02-20',
        success: true,
        referenceCode: '30Ajak'
    });

    fix.aliceWantsToBuySomethingForDave = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix.alice.id,
        target: fix.dave.id,
        success: false,
        referenceCode: 'OiWCrB'
    });

    fix.bobWantsToBuySomethingForEve = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix.bob.id,
        target: fix.eve.id,
        success: false,
        referenceCode: 'AK92oj'
    });


    fix.aliceKnowsBob = new GraphNode({
        owner: fix.alice.id,
        target: fix.bob.id
    });

    fix.bobKnowsAlice = new GraphNode({
        owner: fix.bob.id,
        target: fix.alice.id
    });

    fix.aliceKnowsCarol = new GraphNode({
        owner: fix.alice.id,
        target: fix.carol.id
    });

    fix.aliceKnowsDave = new GraphNode({
        owner: fix.alice.id,
        target: fix.dave.id
    });

    fix.carolKnowsAlice = new GraphNode({
        owner: fix.carol.id,
        target: fix.alice.id
    });

    fix.bobKnowsEve = new GraphNode({
        owner: fix.bob.id,
        target: fix.eve.id
    });

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
