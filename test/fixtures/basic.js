/**
 * Basic test fixtures
 */
'use strict';

var constants = require('../../app/utils/constants');
var FixtureLoader = require('./FixtureLoader');

var db = require('../../app/models');

var getFixtures = function() {
    var fix = {};

    fix.alice = db.Person.build({
        id: 1,
        email: 'foo@bar.baz',
        password: 'foobar',
        nickname: 'Alice',
        fullName: 'Alice Alison'
    });

    fix.bob = db.Person.build({
        id: 2,
        email: 'im@stoop.id',
        password: 'bestpasswordever',
        nickname: 'Bob',
        gender: 'male'
    });

    fix.npc = db.Person.build({
        id: 10,
        email: 'npc@example.com',
        password: 'npc',
        accountType: 'npc',
        nickname: 'Npc'
    });


    fix.dosha = db.Location.build({
        id: 6,
        coordinates: {
            type: 'Point',
            coordinates: [7.452544, 46.957113]
        },
        name: '3dosha',
        type: 'gastronomy',
        addressStreet: 'Moserstrasse',
        addressHouse: '25',
        addressPostcode: '3014',
        addressCity: 'Bern',
        addressCountry: 'Switzerland',
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
        }
    });
    fix.doshaAdded = db.Task.build({
        type: 'AddLocation',
        locationId: fix.dosha.id,
        personId: fix.bob.id,
        createdAt: '2014-08-20',
        outcome: {
            locationAdded: true
        }
    });

    fix.ruprecht = db.Location.build({
        id: 7,
        coordinates: {
            type: 'Point',
            coordinates: [7.441016, 46.946757]
        },
        name: 'Reformhaus Ruprecht',
        type: 'retail',
        addressStreet: 'Christoffelgasse',
        addressHouse: '7',
        addressPostcode: '3011',
        addressCity: 'Bern',
        addressCountry: 'Switzerland',
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
        }
    });
    fix.ruprechtAdded = db.Task.build({
        type: 'AddLocation',
        locationId: fix.ruprecht.id,
        personId: fix.bob.id,
        createdAt: '2014-08-24T10:00:00',
        outcome: {
            locationAdded: true
        }
    });

    fix.hollow = db.Location.build({
        id: 8,
        coordinates: {
            type: 'Point',
            coordinates: [7.446611, 46.953880]
        },
        name: 'Kremoby Hollow',
        type: 'gastronomy',
        addressStreet: 'Schänzlihalde',
        addressHouse: '30',
        addressPostcode: '3013',
        addressCity: 'Bern',
        addressCountry: 'Switzerland',
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
        }
    });
    fix.hollowAdded = db.Task.build({
        type: 'AddLocation',
        locationId: fix.hollow.id,
        personId: fix.alice.id,
        createdAt: '2014-08-10',
        outcome: {
            locationAdded: true
        }
    });

    fix.shop = db.Location.build({
        id: 9,
        coordinates: {
            type: 'Point',
            coordinates: [7.444621, 46.957212]
        },
        name: 'Shop',
        type: 'retail',
        addressStreet: 'Lorrainestrasse',
        addressHouse: '23',
        addressPostcode: '3013',
        addressCity: 'Bern',
        addressCountry: 'Switzerland',
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
        }
    });
    fix.shopAdded = db.Task.build({
        type: 'AddLocation',
        locationId: fix.shop.id,
        personId: fix.npc.id,
        createdAt: '2014-08-07',
        outcome: {
            locationAdded: true
        }
    });

    fix.deletedPlace = db.Location.build({
        id: 11,
        coordinates: {
            type: 'Point',
            coordinates: [7.456015, 46.949960]
        },
        name: 'This place is closed down!',
        type: 'gastronomy',
        existence: 'closedDown',
        owner: fix.alice.id,
        addressStreet: 'Langmauerweg',
        addressHouse: '15c',
        addressPostcode: '3011',
        addressCity: 'Bern',
        addressCountry: 'Switzerland',
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
        deletedAt: Date.now()
    });

    fix.doshaCurry = db.Product.build({
        id: 101,
        locationId: fix.dosha.id,
        name: 'curry',
        availability: constants.PRODUCT_AVAILABILITIES.not
    });
    fix.doshaSamosa = db.Product.build({
        id: 102,
        locationId: fix.dosha.id,
        name: 'samosa',
        availability: constants.PRODUCT_AVAILABILITIES.always
    });

    fix.bobTask1Dosha = db.Task.build({
        type: 'SetLocationProductListComplete',
        locationId: fix.dosha.id,
        personId: fix.bob.id,
        createdAt: '2014-08-20',
        outcome: {
            completionState: constants.PRODUCT_LIST_STATES.incompleteGoodSummary
        }
    });
    fix.bobTask2Dosha = db.Task.build({
        type: 'RateProduct',
        locationId: fix.dosha.id,
        productId: fix.doshaCurry.id,
        personId: fix.bob.id,
        createdAt: '2014-08-20',
        outcome: {
            rating: 4
        }
    });
    fix.bobTask3Dosha = db.Task.build({
        type: 'RateProduct',
        locationId: fix.dosha.id,
        productId: fix.doshaSamosa.id,
        personId: fix.bob.id,
        createdAt: '2014-08-20',
        outcome: {
            rating: 3
        }
    });

    fix.ruprechtTofu = db.Product.build({
        id: 103,
        locationId: fix.ruprecht.id,
        name: 'tofu'
    });

    fix.bobTask1Ruprecht = db.Task.build({
        type: 'SetLocationDescription',
        locationId: fix.ruprecht.id,
        personId: fix.bob.id,
        createdAt: '2014-08-24T11:00:00',
        outcome: {
            description: 'Bio shop with many vegan options.'
        }
    });
    fix.bobTask2Ruprecht = db.Task.build({
        type: 'RateLocationQuality',
        locationId: fix.ruprecht.id,
        personId: fix.bob.id,
        createdAt: '2014-08-24T12:00:00',
        outcome: {
            quality: 3
        }
    });
    fix.aliceTask1Ruprecht = db.Task.build({
        type: 'HaveYouBeenHereRecently',
        locationId: fix.ruprecht.id,
        personId: fix.alice.id,
        createdAt: '2014-08-25T15:00:00',
        outcome: {
            beenHere: 'yes'
        }
    });
    fix.aliceTask2Ruprecht = db.Task.build({
        type: 'SetLocationWebsite',
        locationId: fix.ruprecht.id,
        personId: fix.alice.id,
        createdAt: '2014-08-25T16:00:00',
        outcome: {
            website: 'https://example.com/ruprecht',
            isAvailable: true
        }
    });
    fix.aliceTask3Ruprecht = db.Task.build({
        type: 'AddProduct',
        locationId: fix.ruprecht.id,
        productId: fix.ruprechtTofu.id,
        personId: fix.alice.id,
        createdAt: '2014-08-25T17:00:00',
        outcome: {
            productAdded: true,
            name: 'tofu'
        }
    });
    fix.aliceTask4Ruprecht = db.Task.build({
        type: 'SetProductAvailability',
        locationId: fix.ruprecht.id,
        productId: fix.ruprechtTofu.id,
        personId: fix.alice.id,
        createdAt: Date.now(),
        outcome: {
            availability: constants.PRODUCT_AVAILABILITIES.sometimes
        }
    });

    fix.aliceTask1Hollow = db.Task.build({
        type: 'HaveYouBeenHereRecently',
        locationId: fix.hollow.id,
        personId: fix.alice.id,
        createdAt: '2014-08-10',
        outcome: {
            beenHere: 'yesRightNow'
        }
    });
    fix.aliceTask2Hollow = db.Task.build({
        type: 'SetLocationProductListComplete',
        locationId: fix.hollow.id,
        personId: fix.alice.id,
        createdAt: '2014-08-10',
        outcome: {
            completionState: constants.PRODUCT_LIST_STATES.incomplete
        }
    });
    fix.aliceTask3Hollow = db.Task.build({
        type: 'GiveFeedback',
        locationId: fix.hollow.id,
        personId: fix.alice.id,
        createdAt: '2014-08-10',
        outcome: {
            commitment: 'yes',
            notes: 'Your vegan food is so tasty'
        }
    });
    fix.aliceTask4Hollow = db.Task.build({
        type: 'TagLocation',
        locationId: fix.hollow.id,
        personId: fix.alice.id,
        createdAt: '2014-08-10',
        outcome: {
            tags: [
                'gBreakfast',
                'gLunch',
                'gDinner',
                'gSweets',
                'rnBooks'
            ]
        }
    });
    fix.bobTask1Hollow = db.Task.build({
        type: 'HaveYouBeenHereRecently',
        locationId: fix.hollow.id,
        personId: fix.bob.id,
        createdAt: '2014-08-12',
        outcome: {
            beenHere: 'yes'
        }
    });
    fix.bobTask2Hollow = db.Task.build({
        type: 'BuyProduct',
        locationId: fix.hollow.id,
        personId: fix.bob.id,
        createdAt: '2014-08-15',
        outcome: {
            commitment: 'maybe',
            notes: 'not sure if i am hungry enough'
        }
    });

    fix.bobTask1Shop = db.Task.build({
        type: 'RateLocationQuality',
        locationId: fix.shop.id,
        personId: fix.npc.id,
        createdAt: '2014-08-10',
        outcome: {
            quality: 4
        }
    });

    fix.closedPlaceProduct = db.Product.build({
        id: 104,
        locationId: fix.deletedPlace.id,
        name: 'THIS PRODUCT SHOULD NEVER SHOW UP'
    });

    return fix;
};
exports.getFixtures = getFixtures;

var setupFixtures = function() {
    return FixtureLoader.load(getFixtures());
};
exports.setupFixtures = setupFixtures;


if (require.main === module) {
    setupFixtures()
        .finally(function() {
            db.sequelize.close();
        })
    ;
}
