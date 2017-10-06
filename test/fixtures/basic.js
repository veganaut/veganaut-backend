/**
 * Basic test fixtures
 */
'use strict';

var mongoose = require('mongoose');
var constants = require('../../app/utils/constants');
var FixtureLoader = require('./FixtureLoader');

var Person = mongoose.model('Person');
var Location = mongoose.model('Location');
var Missions = require('../../app/models/Task');
var Product = require('../../app/models/Product');

var getFixtures = function() {
    var fix = {};

    fix.alice = new Person({
        _id: '000000000000000000000001',
        email: 'foo@bar.baz',
        password: 'foobar',
        nickname: 'Alice',
        fullName: 'Alice Alison'
    });

    fix.bob = new Person({
        _id: '000000000000000000000002',
        email: 'im@stoop.id',
        password: 'bestpasswordever',
        nickname: 'Bob',
        gender: 'male'
    });

    fix.npc = new Person({
        _id: '000000000000000000000010',
        email: 'npc@example.com',
        password: 'npc',
        accountType: 'npc',
        nickname: 'Npc'
    });


    fix.dosha = new Location({
        _id: '000000000000000000000006',
        coordinates: [7.452544, 46.957113],
        name: '3dosha',
        type: 'gastronomy',
        address: {
            street: 'Moserstrasse',
            houseNumber: '25',
            postcode: '3014',
            city: 'Bern',
            country: 'Switzerland'
        },
        osmAddress: {
            restaurant: '3dosha ayurveda',
            house_number: '25', // jshint ignore:line
            road: 'Moserstrasse',
            suburb: 'Spitalacker',
            city_district: 'Stadtteil V', // jshint ignore:line
            city: 'Bern',
            county: 'Verwaltungskreis Bern-Mittelland',
            state: 'Bern',
            postcode: '3014',
            country: 'Switzerland',
            country_code: 'ch' // jshint ignore:line
        },
        owner: fix.bob.id
    });
    fix.ruprecht = new Location({
        _id: '000000000000000000000007',
        coordinates: [7.441016, 46.946757],
        name: 'Reformhaus Ruprecht',
        description: 'Bio shop with many vegan options.',
        type: 'retail',
        address: {
            street: 'Christoffelgasse',
            houseNumber: '7',
            postcode: '3011',
            city: 'Bern',
            country: 'Switzerland'
        },
        osmAddress: {
            house_number: '7', // jshint ignore:line
            road: 'Christoffelgasse',
            suburb: 'Rotes Quartier',
            city_district: 'Stadtteil I', // jshint ignore:line
            city: 'Bern',
            county: 'Verwaltungskreis Bern-Mittelland',
            state: 'Bern',
            postcode: '3011',
            country: 'Switzerland',
            country_code: 'ch' // jshint ignore:line
        },
        owner: fix.bob.id
    });
    fix.hollow = new Location({
        _id: '000000000000000000000008',
        coordinates: [7.446611, 46.953880],
        name: 'Kremoby Hollow',
        type: 'gastronomy',
        address: {
            street: 'Schänzlihalde',
            houseNumber: '30',
            postcode: '3013',
            city: 'Bern',
            country: 'Switzerland'
        },
        osmAddress: {
            house_number: '30', // jshint ignore:line
            road: 'Schänzlihalde',
            suburb: 'Altenberg',
            city_district: 'Stadtteil V', // jshint ignore:line
            city: 'Bern',
            county: 'Verwaltungskreis Bern-Mittelland',
            state: 'Bern',
            postcode: '3013',
            country: 'Switzerland',
            country_code: 'ch' // jshint ignore:line
        },
        owner: fix.alice.id
    });
    fix.shop = new Location({
        _id: '000000000000000000000009',
        coordinates: [7.444621, 46.957212],
        name: 'Shop',
        type: 'retail',
        address: {
            street: 'Lorrainestrasse',
            houseNumber: '23',
            postcode: '3013',
            city: 'Bern',
            country: 'Switzerland'
        },
        osmAddress: {
            convenience: 'LOLA',
            house_number: '23', // jshint ignore:line
            road: 'Lorrainestrasse',
            suburb: 'Lorraine',
            city_district: 'Stadtteil V', // jshint ignore:line
            city: 'Bern',
            county: 'Verwaltungskreis Bern-Mittelland',
            state: 'Bern',
            postcode: '3013',
            country: 'Switzerland',
            country_code: 'ch' // jshint ignore:line
        },
        owner: fix.npc.id
    });
    fix.deletedPlace = new Location({
        _id: '000000000000000000000011',
        coordinates: [7.456015, 46.949960],
        name: 'CLOSED: This place should never show up!',
        type: 'gastronomy',
        owner: fix.alice.id,
        address: {
            street: 'Langmauerweg',
            houseNumber: '15c',
            postcode: '3011',
            city: 'Bern',
            country: 'Switzerland'
        },
        osmAddress: {
            house_number: '15c', // jshint ignore:line
            road: 'Langmauerweg',
            suburb: 'Matte',
            city_district: 'Stadtteil I', // jshint ignore:line
            city: 'Bern',
            county: 'Verwaltungskreis Bern-Mittelland',
            state: 'Bern',
            postcode: '3011',
            country: 'Switzerland',
            country_code: 'ch' // jshint ignore:line
        },
        deleted: true
    });

    fix.doshaCurry = new Product({
        _id: '000000000000000000000101',
        location: fix.dosha.id,
        name: 'curry',
        availability: constants.PRODUCT_AVAILABILITIES_STRING_TO_VALUE.temporarilyUnavailable
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
    fix.bobMission2Dosha = new Missions.RateProductMission({
        location: fix.dosha.id,
        person: fix.bob.id,
        completed: '2014-08-20',
        outcome: {
            product: fix.doshaCurry.id,
            info: 4
        }
    });
    fix.bobMission3Dosha = new Missions.RateProductMission({
        location: fix.dosha.id,
        person: fix.bob.id,
        completed: '2014-08-20',
        outcome: {
            product: fix.doshaSamosa.id,
            info: 3
        }
    });

    fix.ruprechtTofu = new Product({
        _id: '000000000000000000000103',
        location: fix.ruprecht.id,
        name: 'tofu'
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
    fix.aliceMission3Ruprecht = new Missions.WhatOptionsMission({
        location: fix.ruprecht.id,
        person: fix.alice.id,
        completed: '2014-08-25T17:00:00',
        outcome: [
            {
                product: fix.ruprechtTofu.id
            }
        ]
    });
    fix.aliceMission4Ruprect = new Missions.SetProductAvailMission({
        location: fix.ruprecht.id,
        person: fix.alice.id,
        completed: Date.now(),
        outcome: {
            product: fix.ruprechtTofu,
            info: 'available'
        }
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
    fix.aliceMission4Hollow = new Missions.LocationTagsMission({
        location: fix.hollow.id,
        person: fix.alice.id,
        completed: '2014-08-10',
        outcome: [
            'gBreakfast',
            'gLunch',
            'gDinner',
            'gSweets',
            'rnBooks'
        ]
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

    fix.bobMission1Shop = new Missions.OfferQualityMission({
        location: fix.shop.id,
        person: fix.npc.id,
        completed: '2014-08-10',
        outcome: 4
    });

    fix.closedPlaceProduct = new Product({
        _id: '000000000000000000000104',
        location: fix.deletedPlace.id,
        name: 'THIS PRODUCT SHOULD NEVER SHOW UP'
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
