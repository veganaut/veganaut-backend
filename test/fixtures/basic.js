/**
 * Basic test fixtures
 */
'use strict';

var mongoose = require('mongoose');
var FixtureLoader = require('./FixtureLoader');
var activities = require('./activities');

var Person = mongoose.model('Person');
var ActivityLink = mongoose.model('ActivityLink');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

var getFixtures = function() {
    var fix = activities.getFixtures();
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
        type: 'gastronomy',
        availablePoints: 500,
        previousOwnerStart: '2014-08-20',
        currentOwnerStart: '2014-08-20'
    });
    fix.ruprecht = new Location({
        _id: '000000000000000000000007',
        coordinates: [46.946757, 7.441016],
        name: 'Reformhaus Ruprecht',
        type: 'retail',
        previousOwnerStart: '2014-08-24',
        currentOwnerStart: '2014-08-25'
    });
    fix.hollow = new Location({
        _id: '000000000000000000000008',
        coordinates: [46.953880, 7.446611],
        name: 'Kremoby Hollow',
        type: 'gastronomy',
        previousOwnerStart: '2014-08-10',
        currentOwnerStart: '2014-08-15'
    });

    fix.bobVisitedDosha = new Visit({
        location: fix.dosha.id,
        person: fix.bob.id,
        completed: '2014-08-20',
        missions: [
            {
                type: 'visitBonus',
                outcome: true
            },
            {
                type: 'hasOptions',
                outcome: true
            },
            {
                type: 'whatOptions',
                outcome: ['curry']
            }
        ]
    });

    fix.bobVisitedRuprecht = new Visit({
        location: fix.ruprecht.id,
        person: fix.bob.id,
        completed: '2014-08-24',
        missions: [
            {
                type: 'hasOptions',
                outcome: true
            },
            {
                type: 'whatOptions',
                outcome: ['fries', 'napoli']
            }
        ]
    });
    fix.aliceVisitedRuprecht = new Visit({
        location: fix.ruprecht.id,
        person: fix.alice.id,
        completed: '2014-08-25',
        missions: [
            {
                type: 'visitBonus',
                outcome: true
            },
            {
                type: 'hasOptions',
                outcome: true
            }
        ]
    });

    fix.aliceVisitedHollow = new Visit({
        location: fix.hollow.id,
        person: fix.alice.id,
        completed: '2014-08-10',
        missions: [
            {
                type: 'visitBonus',
                outcome: true
            },
            {
                type: 'hasOptions',
                outcome: true
            },
            {
                type: 'whatOptions',
                outcome: ['smoothie', 'cake']
            },
            {
                type: 'giveFeedback',
                outcome: { text: 'Your vegan food is so tasty', didNotDoIt: true }
            }
        ]
    });
    fix.bobVisitedHollow = new Visit({
        location: fix.hollow.id,
        person: fix.bob.id,
        completed: '2014-08-12',
        missions: [
            {
                type: 'hasOptions',
                outcome: true
            },
            {
                type: 'whatOptions',
                outcome: ['smoothie', 'cookies', 'cake']
            }
        ]
    });
    fix.bobVisitedHollowAgain = new Visit({
        location: fix.hollow.id,
        person: fix.bob.id,
        completed: '2014-08-15',
        missions: [
            {
                type: 'visitBonus',
                outcome: true
            },
            {
                type: 'hasOptions',
                outcome: true
            },
            {
                type: 'whatOptions',
                outcome: ['smoothie', 'cookies', 'cake']
            },
            {
                type: 'buyOptions',
                outcome: ['smoothie', 'cake']
            }
        ]
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
