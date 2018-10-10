/**
 * Ugly script for importing the old MongoDB data to PostgreSQL
 *
 * How to run this:
 * From the directory containing this script, run:
 * > node importMongoData.js {importStep}
 * With the import steps defined in IMPORT_STEPS (in that order)
 */
'use strict';

var IMPORT_STEPS = [
    'parseLocationDates',   // Takes a second
    'parseProductDates',    // Takes a second
    'locations',            // Takes a bit less than a minute
    'products',             // Takes a bit more than a minute
    'people',               // Takes a few seconds
    'tasks'                 // Takes about 5 minutes
];

var fs = require('fs');
var db = require('../../app/models');
var _ = require('lodash');
var BPromise = require('bluebird');
var constants = require('../../app/utils/constants');
var utils = require('../../app/utils/utils');

var exitWrongParams = function() {
    console.error('ERROR: Provide valid import step:', IMPORT_STEPS.join(', '));
    process.exit(1);
};

if (process.argv.length !== 3) {
    exitWrongParams();
}

var importStep = process.argv[2];
if (IMPORT_STEPS.indexOf(importStep) === -1) {
    exitWrongParams();
}

var convertPersonMongoId = function(mongoId) {
    return Math.round(parseInt(mongoId.substr(19, 5), 16)) % 100000;
};


var getLocationDates = function() {
    var missions = require('./data/live-export-missions-2018-10-10.json').data;

    var locationCreatedDates = {};

    _.each(missions, function(mis) {
        if (mis.__t === 'AddLocationMission') {
            if (locationCreatedDates.hasOwnProperty(mis.location.$oid)) {
                console.error('ERROR: Found multiple AddLocation missions for the same location:', mis.location.$oid);
            }
            locationCreatedDates[mis.location.$oid] = mis.completed.$date;
        }
    });

    return locationCreatedDates;
};

var getProductDates = function() {
    var missions = require('./data/live-export-missions-2018-10-10.json').data;

    var productDates = {};

    var setCreatedAt = function(productId, date) {
        productDates[productId] = productDates[productId] || {};
        if (productDates[productId].hasOwnProperty('createdAt')) {
            console.error('ERROR: Found multiple WhatOptionsMission missions for the same product:', productId);
        }
        else {
            productDates[productId].createdAt = date;
            setUpdatedDate(productId, date);
        }
    };

    var setUpdatedDate = function(productId, date) {
        productDates[productId] = productDates[productId] || {};
        if (!productDates[productId].hasOwnProperty('updatedAt') ||
            new Date(productDates[productId].updatedAt) < new Date(date))
        {
            productDates[productId].updatedAt = date;
        }
    };

    _.each(missions, function(mis) {
        if (mis.__t === 'WhatOptionsMission') {
            _.each(mis.outcome, function(out) {
                setCreatedAt(out.product.$oid, mis.completed.$date);
            });
        }
        else if (mis.__t === 'RateProductMission' ||
            mis.__t === 'SetProductAvailMission' ||
            mis.__t === 'SetProductNameMission')
        {
            setUpdatedDate(mis.outcome.product.$oid, mis.completed.$date);
        }
    });

    return productDates;
};

var prepareLocations = function() {
    var locations = require('./data/live-export-locations-2018-10-10.json').data;

    var locationCreatedDates = require('./data/generated-location-dates.json');

    // var existing = {};
    // _.each(locations, function(loc) {
    //     var id = utils.convertLocationMongoDbIdToPostgresId(loc._id.$oid);
    //     if (existing[id]) {
    //         console.log('clash', loc);
    //     }
    //     else {
    //         existing[id] = true;
    //     }
    // });
    //
    // console.log(Object.keys(existing).length);
    // console.log(locations.length);

    /*
     * TODO WIP WHEN MIGRATING:
     * - check that the converted ids are still all unique CHECKED ON 2018-09-19: OK
     * - check hooks again (they are deactivated) CHECKED ON 2018-09-19: OK to keep hooks deactivated
     */
    return _.map(locations, function(loc) {
        var createdAt;
        if (locationCreatedDates.hasOwnProperty(loc._id.$oid)) {
            createdAt = locationCreatedDates[loc._id.$oid];
        }
        else {
            // There are 52 places that were created before there were AddLocation missions, for TODO NEXT: add fake AddLocation tasks for these places
            // those we set a created at time that is shortly before this feature was released
            createdAt = new Date('2014-08-01T00:00:00.000Z');
            console.warn('WARNING: Using default createdAt location (OK for 52 locations from Tibits (Bahnhof) to Pintli)',
                loc._id.$oid, loc.name
            );
        }

        // Check if it was deleted. We assume it's closed down if that's the case
        // and set the deleted date to last day of 2017 (as we can't reconstruct that)
        var existence = loc.deleted ? constants.LOCATION_EXISTENCE_STATES.closedDown : constants.LOCATION_EXISTENCE_STATES.existing;
        var deletedAt = loc.deleted ? new Date('2017-12-31T00:00:00.000Z') : undefined;

        return db.Location.build({
            id: utils.convertLocationMongoDbIdToPostgresId(loc._id.$oid),
            coordinates: {
                type: 'Point',
                coordinates: loc.coordinates
            },
            name: loc.name,
            description: loc.description,
            type: loc.type,
            qualityTotal: loc.quality.total,
            qualityCount: loc.quality.count,
            qualityRank: loc.quality.rank,
            website: loc.link,
            addressStreet: loc.address.street,
            addressHouse: loc.address.houseNumber,
            addressPostcode: loc.address.postcode,
            addressCity: loc.address.city,
            addressCountry: loc.address.country,
            osmAddress: loc.osmAddress,
            tags: loc.tags,
            existence: existence,
            createdAt: createdAt,
            updatedAt: loc.updatedAt.$date,
            deletedAt: deletedAt
        });
    });
};

var prepareProducts = function() {
    var products = require('./data/live-export-products-2018-10-10.json').data;

    var productDates = require('./data/generated-product-dates.json');

    /*
     * TODO WIP WHEN MIGRATING:
     * - check hooks again (they are NOT deactivated) CHECKED ON 2018-09-19: OK to keep hooks activated
     */
    return _.map(products, function(prod) {
        if (prod.name.length > 256) {
            console.error('ERROR: Name of product too long (max 256)', prod._id.$oid, prod.name);
        }

        var availability = constants.PRODUCT_AVAILABILITIES.unknown;
        if (prod.availability === 0) {
            availability = constants.PRODUCT_AVAILABILITIES.not;
        }
        else if (prod.availability === 50) {
            availability = constants.PRODUCT_AVAILABILITIES.sometimes;
        }

        var dates = productDates[prod._id.$oid] || {};
        if (!dates.createdAt) {
            console.error('ERROR: no createdAt date found for product', prod._id.$oid, prod.name);
        }
        if (!dates.updatedAt) {
            console.error('ERROR: no updatedAt date found for product', prod._id.$oid, prod.name);
        }

        var p = db.Product.build({
            name: prod.name,
            locationId: utils.convertLocationMongoDbIdToPostgresId(prod.location.$oid),
            ratingTotal: prod.rating.total,
            ratingCount: prod.rating.count,
            ratingRank: prod.rating.rank,
            availability: availability,
            createdAt: dates.createdAt,
            updatedAt: dates.updatedAt
        });

        // This is used to save the mapping of old to new id to file
        p.mongoId = prod._id.$oid;

        return p;
    });
};

var preparePeople = function() {
    var people = require('./data/live-export-people-2018-10-10.json').data;

    // var existing = {};
    // _.each(people, function(per) {
    //     var id = convertPersonMongoId(per._id.$oid);
    //     if (existing[id]) {
    //         console.log('clash', per);
    //     }
    //     else {
    //         existing[id] = true;
    //     }
    // });
    //
    // console.log(Object.keys(existing).length);
    // console.log(people.length);

    /*
     * TODO WIP WHEN MIGRATING:
     * - before importing: check that the converted ids are still all unique CHECKED ON 2018-09-19: OK
     * - check hooks again (they are deactivated) CHECKED ON 2018-09-19: OK to keep hooks deactivated
     */
    return _.map(people, function(per) {
        return db.Person.build({
            id: convertPersonMongoId(per._id.$oid),
            email: per.email,
            password: per.password,
            nickname: per.nickname,
            fullName: per.fullName,
            locale: per.locale,
            accountType: per.accountType,
            resetPasswordToken: per.resetPasswordToken,
            resetPasswordExpires: per.resetPasswordExpires ? per.resetPasswordExpires.$date : undefined,
            createdAt: per.createdAt.$date,
            updatedAt: per.createdAt.$date
        });
    });
};

var prepareTasks = function() {
    var missions = require('./data/live-export-missions-2018-10-10.json').data;

    var productMongoIdToNewId = require('./data/generated-product-mongo-to-postgre-id.json');

    /*
     * TODO WIP WHEN MIGRATING:
     * - delete mission acting on location id 54be8dac623a95b0342c05c2 (this location somehow doesn't exist)
     * - check hooks again (they are deactivated) CHECKED ON 2018-09-19: OK to keep hooks deactivated
     */

    var taskDefinitions = [];

    _.each(missions, function(mis) {
        var taskData = {
            personId: convertPersonMongoId(mis.person.$oid),
            locationId: utils.convertLocationMongoDbIdToPostgresId(mis.location.$oid),
            byNpc: mis.isNpcMission,
            createdAt: mis.completed.$date
        };

        switch (mis.__t) {
        case 'AddLocationMission':
            taskData.type = 'AddLocation';
            taskData.outcome = {
                locationAdded: true
            };
            taskDefinitions.push(taskData);
            break;
        case 'BuyOptionsMission':
            taskData.type = 'BuyProduct';
            taskData.outcome = {
                commitment: 'yes',
                notes: 'Bought: ' + _.map(mis.outcome, function(out) {
                    return '"' + productMongoIdToNewId[out.product.$oid].name + '"';
                }).join(', ')
            };
            taskDefinitions.push(taskData);
            break;
        case 'EffortValueMission':
            taskData.type = 'LegacyEffortValueTask';
            taskData.outcome = {
                effortValue: mis.outcome
            };
            taskDefinitions.push(taskData);
            break;
        case 'GiveFeedbackMission':
            taskData.type = 'GiveFeedback';
            taskData.outcome = {
                commitment: 'yes',
                notes: mis.outcome
            };
            taskDefinitions.push(taskData);
            break;
        case 'HasOptionsMission':
            taskData.type = 'LegacyHasOptionsTask';
            taskData.outcome = {
                hasOptions: mis.outcome
            };
            taskDefinitions.push(taskData);
            break;
        case 'LocationTagsMission':
            taskData.type = 'TagLocation';
            taskData.outcome = {
                tags: mis.outcome
            };
            taskDefinitions.push(taskData);
            break;
        case 'OfferQualityMission':
            taskData.type = 'RateLocationQuality';
            taskData.outcome = {
                quality: mis.outcome
            };
            taskDefinitions.push(taskData);
            break;
        case 'RateProductMission':
            taskData.type = 'RateProduct';
            taskData.productId = productMongoIdToNewId[mis.outcome.product.$oid].id;
            taskData.outcome = {
                rating: mis.outcome.info
            };
            taskDefinitions.push(taskData);
            break;
        case 'SetProductAvailMission':
            var mapping = {
                unavailable: constants.PRODUCT_AVAILABILITIES.not,
                temporarilyUnavailable: constants.PRODUCT_AVAILABILITIES.sometimes,
                available: constants.PRODUCT_AVAILABILITIES.always
            };

            taskData.type = 'SetProductAvailability';
            taskData.productId = productMongoIdToNewId[mis.outcome.product.$oid].id;
            taskData.outcome = {
                availability: mapping[mis.outcome.info]
            };
            taskDefinitions.push(taskData);
            break;
        case 'SetProductNameMission':
            taskData.type = 'SetProductName';
            taskData.productId = productMongoIdToNewId[mis.outcome.product.$oid].id;
            taskData.outcome = {
                name: mis.outcome.info
            };
            taskDefinitions.push(taskData);
            break;
        case 'VisitBonusMission':
            taskData.type = 'HaveYouBeenHereRecently';
            taskData.outcome = {
                beenHere: 'yes'
            };
            taskDefinitions.push(taskData);
            break;
        case 'WantVeganMission':
            taskData.type = 'LegacyWantVeganTask';
            taskData.outcome = {
                wantVegan: _.map(mis.outcome, function(out) {
                    return {
                        expression: out.expression,
                        expressionType: out.expressionType
                    };
                })
            };
            taskDefinitions.push(taskData);
            break;
        case 'WhatOptionsMission':
            taskData.type = 'AddProduct';

            // Create a Task for every product that was added
            _.each(mis.outcome, function(out) {
                var tData = _.cloneDeep(taskData);
                tData.productId = productMongoIdToNewId[out.product.$oid].id;
                tData.outcome = {
                    productAdded: true,
                    name: productMongoIdToNewId[out.product.$oid].name
                };
                taskDefinitions.push(tData);
            });
            break;
        default:
            console.error('ERROR: Mission with unknown type:', mis.__t);
            break;
        }
    });

    return _.map(taskDefinitions, function(def) {
        return db.Task.build(def);
    });
};


// Start the import step if run as main module
if (require.main === module) {
    console.log('Importing', importStep);

    if (importStep === 'parseLocationDates') {
        fs.writeFile('generated-location-dates.json.json', JSON.stringify(getLocationDates()), function(err) {
            if (err) {
                return console.error('ERROR: writing generated-location-dates.json.json', err);
            }
            console.log('generated-location-dates.json.json saved');
        });

    }
    else if (importStep === 'parseProductDates') {
        fs.writeFile('generated-product-dates.json', JSON.stringify(getProductDates()), function(err) {
            if (err) {
                return console.log('ERROR: writing generated-product-dates.json', err);
            }
            console.log('generated-product-dates.json saved');
        });
    }
    else if (importStep === 'locations') {
        BPromise
            .mapSeries(prepareLocations(), function(dat) {
                return dat.save({
                    silent: true,

                    // Don't run the hooks: there's only one that would check for missing address
                    hooks: false
                });
            })
            .catch(function(err) {
                console.log('ERROR: while importing data: ', err);
            })
            .finally(function() {
                db.sequelize.close();
            })
        ;
    }
    else if (importStep === 'products') {
        var productMongoIdToNewId = {};

        BPromise
            .mapSeries(prepareProducts(), function(dat) {
                return dat
                    .save({
                        silent: true,

                        // Run the hooks: there's only one sets the isAvailable flag based on availability
                        hooks: true
                    })
                    .then(function(p) {
                        productMongoIdToNewId[p.mongoId] = {
                            id: p.id,
                            name: p.name
                        };
                    });
            })
            .catch(function(err) {
                console.error('ERROR: while importing data: ', err);
            })
            .finally(function() {
                db.sequelize.close();

                fs.writeFile('generated-product-mongo-to-postgre-id.json', JSON.stringify(productMongoIdToNewId), function(err) {
                    if (err) {
                        return console.error('ERROR: writing generated-product-mongo-to-postgre-id.json', err);
                    }
                    console.log('generated-product-mongo-to-postgre-id.json saved');
                    // TODO WIP WHEN MIGRATING: Remove weird zero-width chars & nbsp from file
                });
            })
        ;
    }
    else if (importStep === 'people') {
        BPromise
            .mapSeries(preparePeople(), function(dat) {
                return dat.save({
                    silent: true,

                    // Don't run the hooks: they would encrypt the password and resetPasswordToken (already encrypted in the import)
                    hooks: false
                });
            })
            .catch(function(err) {
                console.error('ERROR: while importing data: ', err);
            })
            .finally(function() {
                db.sequelize.close();
            })
        ;
    }
    else if (importStep === 'tasks') {
        BPromise
            .mapSeries(prepareTasks(), function(dat) {
                return dat.save({
                    silent: true,

                    // Don't run the hooks: they would update the Location (we already import the locations in the correct state)
                    hooks: false
                });
            })
            .catch(function(err) {
                console.error('ERROR: while importing data: ', err);
            })
            .finally(function() {
                db.sequelize.close();
            })
        ;
    }
}


/*

// Queries to update the quality of locations and ratings of products to only include the latest Task of every person
// TODO WIP WHEN MIGRATING: Run this after the import

WITH "newValues" AS (
	SELECT tasks."locationId", SUM(CAST(outcome ->> 'quality' AS INTEGER)) as "qualityTotal", count(id) as "qualityCount",
	((SUM(CAST(outcome ->> 'quality' AS INTEGER)) + 6.0) / (count(id) + 2.0)) as "qualityRank"
	FROM tasks
	INNER JOIN
		(SELECT "locationId", "personId", MAX("createdAt") as time
		FROM tasks
		WHERE type = 'RateLocationQuality'
		GROUP BY "locationId", "personId"
		) last
	ON last."locationId" = tasks."locationId" AND last."personId" = tasks."personId" AND last.time = tasks."createdAt"
	GROUP BY tasks."locationId"
)
UPDATE "locations"
SET "qualityTotal" = "newValues"."qualityTotal", "qualityCount" = "newValues"."qualityCount", "qualityRank" = "newValues"."qualityRank"
FROM "newValues"
WHERE "newValues"."locationId" = "locations"."id";

WITH "newValues" AS (
	SELECT tasks."productId", SUM(CAST(outcome ->> 'rating' AS INTEGER)) as "ratingTotal", count(id) as "ratingCount",
	((SUM(CAST(outcome ->> 'rating' AS INTEGER)) + 6.0) / (count(id) + 2.0)) as "ratingRank"
	FROM tasks
	INNER JOIN
		(SELECT "productId", "personId", MAX("createdAt") as time
		FROM tasks
		WHERE type = 'RateProduct'
		GROUP BY "productId", "personId"
		) last
	ON last."productId" = tasks."productId" AND last."personId" = tasks."personId" AND last.time = tasks."createdAt"
	GROUP BY tasks."productId"
)
UPDATE "products"
SET "ratingTotal" = "newValues"."ratingTotal", "ratingCount" = "newValues"."ratingCount", "ratingRank" = "newValues"."ratingRank"
FROM "newValues"
WHERE "newValues"."productId" = "products"."id";

 */
