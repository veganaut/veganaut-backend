/**
 * Basic test fixtures
 */
'use strict';

var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var activites = require('./activities');

var Person = mongoose.model('Person');
var ActivityLink = mongoose.model('ActivityLink');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');
var Mission = mongoose.model('Mission');

var getFixtures = function() {
    var fix = activites.getFixtures();
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
        fullName: 'Dave Donaldsson'
    });

    fix.eve = new Person({
        _id: '000000000000000000000005',
        fullName: 'Eve'
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

    fix.dosha = new Location({
        _id: '000000000000000000000006',
        coordinates: [46.957113, 7.452544],
        name: '3dosha',
        type: 'gastronomy'
    });
    fix.ruprecht = new Location({
        _id: '000000000000000000000007',
        coordinates: [46.946757, 7.441016],
        name: 'Reformhaus Ruprecht',
        type: 'retail'
    });
    fix.hollow = new Location({
        _id: '000000000000000000000008',
        coordinates: [46.953880, 7.446611],
        name: 'Kremoby Hollow',
        type: 'private'
    });
    fix.bobVisitedRuprecht = new Visit({
        _id: '000000000000000000000009',
        location: fix.ruprecht.id,
        person: fix.bob.id,
        completed: '2014-08-24'
    });
    fix.bobMissionOptionsAvailable = new Mission({
        type: 'optionsAvailable',
        visit: fix.bobVisitedRuprecht.id,
        outcome: true
    });
    fix.bobMissionWhatOptions = new Mission({
        type: 'whatOptions',
        visit: fix.bobVisitedRuprecht.id,
        outcome: ['fries', 'napoli']
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
