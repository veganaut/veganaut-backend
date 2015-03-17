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
var Missions = require('../../app/models/Missions');
var Product = require('../../app/models/Product');

var getFixtures = function() {
    var fix = activities.getFixtures();
    // TODO: add users of other teams
    fix.alice = new Person({
        _id: '000000000000000000000001',
        email: 'foo@bar.baz',
        password: 'foobar',
        team: 'team1',
        nickname: 'Alice',
        fullName: 'Alice Alison'
    });

    fix.bob = new Person({
        _id: '000000000000000000000002',
        email: 'im@stoop.id',
        password: 'bestpasswordever',
        team: 'team2',
        nickname: 'Bob',
        fullName: 'Bob Burton',
        gender: 'male'
    });

    fix.carol = new Person({
        _id: '000000000000000000000003',
        team: 'team1',
        nickname: 'Carol'
    });

    fix.dave = new Person({
        _id: '000000000000000000000004',
        nickname: 'Dave Donaldsson'
    });

    fix.eve = new Person({
        _id: '000000000000000000000005',
        nickname: 'Eve'
    });


    fix.aliceBuysSomethingForBob = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix.alice.id,
        target: fix.bob.id,
        location: 'Bern, Switzerland',
        createdAt: '2014-01-10',
        completedAt: '2014-01-11',
        referenceCode: 'Ff8tEQ'
    });

    fix.aliceCooksSomethingForCarol = new ActivityLink({
        activity: fix.cookActivity.id,
        source: fix.alice.id,
        target: fix.carol.id,
        location: 'Bern',
        createdAt: '2014-02-20',
        completedAt: '2014-01-22',
        referenceCode: '30Ajak'
    });

    fix.aliceWantsToBuySomethingForDave = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix.alice.id,
        target: fix.dave.id,
        referenceCode: 'OiWCrB'
    });

    fix.bobWantsToBuySomethingForEve = new ActivityLink({
        activity: fix.buyActivity.id,
        source: fix.bob.id,
        target: fix.eve.id,
        referenceCode: 'AK92oj'
    });

    fix.dosha = new Location({
        _id: '000000000000000000000006',
        coordinates: [7.452544, 46.957113],
        name: '3dosha',
        type: 'gastronomy'
    });
    fix.ruprecht = new Location({
        _id: '000000000000000000000007',
        coordinates: [7.441016, 46.946757],
        name: 'Reformhaus Ruprecht',
        type: 'retail'
    });
    fix.hollow = new Location({
        _id: '000000000000000000000008',
        coordinates: [7.446611, 46.953880],
        name: 'Kremoby Hollow',
        type: 'gastronomy'
    });

    fix.doshaCurry = new Product({
        _id: '000000000000000000000101',
        location: fix.dosha.id,
        name: 'curry'
    });

    fix.doshaSamosa = new Product({
        _id: '000000000000000000000102',
        location: fix.dosha.id,
        name: 'samosa'
    });

    fix.bobMission1Dosha = new Missions.HasOptionsMission({
        location: fix.dosha.id,
        person: fix.bob.id,
        completed: '2014-08-20',
        outcome: 'yes'
    });
    fix.bobMission2Dosha = new Missions.RateOptionsMission({
        location: fix.dosha.id,
        person: fix.bob.id,
        completed: '2014-08-20',
        outcome: [
            {
                product: fix.doshaCurry.id,
                info: 4
            },
            {
                product: fix.doshaSamosa.id,
                info: 3
            }
        ]
    });

    fix.bobMission1Ruprecht = new Missions.HasOptionsMission({
        location: fix.ruprecht.id,
        person: fix.bob.id,
        completed: '2014-08-24T11:00:00',
        outcome: 'yes'
    });
    fix.bobMission2Ruprecht = new Missions.OfferQualityMission({
        location: fix.ruprecht.id,
        person: fix.bob.id,
        completed: '2014-08-24T12:00:00',
        outcome: 3
    });
    fix.aliceMission1Ruprecht = new Missions.VisitBonusMission({
        location: fix.ruprecht.id,
        person: fix.alice.id,
        completed: '2014-08-25T15:00:00',
        outcome: true
    });
    fix.aliceMission2Ruprecht = new Missions.HasOptionsMission({
        location: fix.ruprecht.id,
        person: fix.alice.id,
        completed: '2014-08-25T16:00:00',
        outcome: 'yes'
    });

    fix.aliceMission1Hollow = new Missions.VisitBonusMission({
        location: fix.hollow.id,
        person: fix.alice.id,
        completed: '2014-08-10',
        outcome: true
    });
    fix.aliceMission2Hollow = new Missions.HasOptionsMission({
        location: fix.hollow.id,
        person: fix.alice.id,
        completed: '2014-08-10',
        outcome: 'yes'
    });
    fix.aliceMission3Hollow = new Missions.GiveFeedbackMission({
        location: fix.hollow.id,
        person: fix.alice.id,
        completed: '2014-08-10',
        outcome: 'Your vegan food is so tasty'
    });
    fix.bobMission1Hollow = new Missions.HasOptionsMission({
        location: fix.hollow.id,
        person: fix.bob.id,
        completed: '2014-08-12',
        outcome: 'yes'
    });
    fix.bobMission2Hollow = new Missions.VisitBonusMission({
        location: fix.hollow.id,
        person: fix.bob.id,
        completed: '2014-08-15',
        outcome: true
    });

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function(done) {
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
