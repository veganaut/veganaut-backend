'use strict';
var _ = require('lodash');
var BPromise = require('bluebird');
var utils = require('../utils/utils');
var constants = require('../utils/constants');
var ratingModelAddOn = require('../utils/ratingModelAddOn');
var osmUtils = require('../utils/osmUtils');
var osmAddressLookup = BPromise.promisify(osmUtils.osmAddressLookup);

var Sequelize = require('sequelize');

// Maximum longitude over which one can get the locations by bounding box
var BOUNDING_BOX_MAX_LNG = 180;

module.exports = function(sequelize, DataTypes) {
    // TODO WIP: add validations everywhere
    // TODO WIP: location should get a "slug" (and id should not be exposed at all?)
    var Location = sequelize.define('location');

    /*
    DB changes necessary for the search index
    TODO WIP: make this part of the migration (and improve the search index)
    ALTER TABLE "locations" ADD COLUMN "searchVector" TSVECTOR;

    UPDATE "locations" SET "searchVector" = to_tsvector('english', 'name' || 'description');

    CREATE INDEX location_search_idx ON "locations" USING gin("searchVector");

    CREATE TRIGGER location_search_vector_update BEFORE INSERT OR UPDATE ON "locations" FOR EACH ROW
        EXECUTE PROCEDURE tsvector_update_trigger("searchVector", 'pg_catalog.english', name, description);
     */

    var locationSchema = {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        type: {
            type: DataTypes.ENUM,
            values: constants.LOCATION_TYPES,
            allowNull: false
        },
        coordinates: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: false
        },
        website: {
            type: DataTypes.STRING
        },
        addressStreet: {
            type: DataTypes.STRING
        },
        addressHouse: {
            type: DataTypes.STRING
        },
        addressPostcode: {
            type: DataTypes.STRING
        },
        addressCity: {
            type: DataTypes.STRING
        },
        addressCountry: {
            type: DataTypes.STRING
        },
        osmAddress: {
            type: DataTypes.JSONB
        },
        productListComplete: {
            type: DataTypes.ENUM,
            values: Object.keys(constants.PRODUCT_LIST_STATES)
        },
        // carnistLevel: {
        //     type: DataTypes.ENUM(
        //         'vegan',
        //         'vegetarian',
        //         'omnivorous',
        //         'meatHeavy'
        //     )
        // },
        // labellingLevel: {
        //     type: DataTypes.ENUM(
        //         'all',
        //         'partially',
        //         'not'
        //     )
        // },
        // priceLevel: {
        //     type: DataTypes.ENUM(
        //         'low',
        //         'medium',
        //         'high'
        //     )
        // },
        existence: {
            type: DataTypes.ENUM,
            values: Object.keys(constants.LOCATION_EXISTENCE_STATES),
            allowNull: false,
            defaultValue: constants.LOCATION_EXISTENCE_STATES.existing
        },
        tags: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        }
    };

    var locationOptions = {
        paranoid: true,
        getterMethods: {
            lat: function() {
                if (this.coordinates) {
                    return this.coordinates.coordinates[1];
                }
                return undefined;
            },
            lng: function() {
                if (this.coordinates) {
                    return this.coordinates.coordinates[0];
                }
                return undefined;
            }
        },
        setterMethods: {
            // TODO: only allow lat and lng to be set together?
            lat: function(value) {
                this.setDataValue('coordinates', utils.createPoint(value, this.lng));
            },
            lng: function(value) {
                this.setDataValue('coordinates', utils.createPoint(this.lat, value));
            }
        },
        sequelize: sequelize
    };

    // Add the quality rating to the model definition
    ratingModelAddOn('quality', 1, 5, DataTypes, Location, locationSchema, locationOptions);

    // Initialise the model
    Location.init(locationSchema, locationOptions);

    // Method that is called by the model loader to link the different models
    Location.associate = function(models) {
        Location.hasMany(models.Task);
        Location.hasMany(models.Product);
    };

    Location.hook('beforeSave', function(loc) {
        // If we have coordinates and either no osmAddress yet or the coordinates changed, look the address up
        // (The "!loc.isNewRecord" is needed to not fetch the address for the basic fixtures. This works
        // because for new records that aren't fixtures, the osmAddress is undefined)
        if (typeof loc.coordinates !== 'undefined' &&
            (typeof loc.osmAddress === 'undefined' ||
                (!loc.isNewRecord && loc.changed('coordinates'))))
        {
            // TODO: This is also done during the frontend e2e tests. It's acceptable because those are not run so often, but would still be good to improve the situation.
            return osmAddressLookup(loc.lat, loc.lng)
                .then(function(lookup) {
                    // Nominatim sends errors with a 200 status code...
                    if (typeof lookup === 'object' && typeof lookup.error === 'string') {
                        throw new Error('Error finding address for ' + loc.name +
                            loc.lat + loc.lng +
                            lookup.error
                        );
                    }

                    loc.osmAddress = lookup.address;
                    _.extend(loc, osmUtils.convertFromOsmAddress(loc.osmAddress));
                });
        }
    });

    /**
     * Returns the where clause to be used for full text location search
     * @param {string} searchString
     * @returns {{}}
     */
    Location.getSearchQuery = function(searchString) {
        return {
            // It works like this, couldn't find a better way in sequelize to do it...
            searchVector: sequelize.literal(
                '"searchVector" @@ plainto_tsquery(\'english\', ' +
                sequelize.escape(searchString) + ')'
            )
        };
    };

    /**
     * Returns the filter to use on 'coordinates' to limit results by a bounding box.
     * Will throw an error if the given bounds are invalid, but not if no bounds are given.
     * @param {string} [boundingBoxString] In the format 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
     * @returns {{}|undefined}
     */
    Location.getBoundingBoxQuery = function(boundingBoxString) {
        var query;
        if (typeof boundingBoxString === 'string') {
            var bounds = boundingBoxString.split(',');

            // Checks if every item is a valid number
            var invalidBounds = false;
            bounds = _.map(bounds, function(x) {
                var b = parseFloat(x);
                if (isNaN(b)) {
                    invalidBounds = true;
                }
                return b;
            });

            if (invalidBounds) {
                throw new Error('Bounds are invalid');
            }

            // Only set the coordinates if the bounding box is not too big
            if (Math.abs(bounds[2] - bounds[0]) < BOUNDING_BOX_MAX_LNG) {
                query = {
                    coordinates: {
                        // TODO: would be better to use the contains/containedBy operator, but sequelize doesn't have it.
                        $overlap: Sequelize.fn(
                            'ST_MakeEnvelope',
                            bounds[0],
                            bounds[1],
                            bounds[2],
                            bounds[3]
                        )
                    }
                };
            }
        }

        return query;
    };

    /**
     * Creates a $within query based on the given center (lat/lng) and radius
     * @param {number} lat
     * @param {number} lng
     * @param {number} radius Radius around the lat/lng in meters to query for locations.
     * @returns {{}|undefined}
     */
    Location.getCenterQuery = function(lat, lng, radius) {
        var query;
        // TODO: should we check if the radius is so big that this includes the whole world and then return an empty query?

        if (typeof lat !== 'undefined' && typeof lng !== 'undefined' && typeof radius !== 'undefined') {
            query = Sequelize.where(
                Sequelize.fn(
                    'ST_Distance_Sphere',
                    Sequelize.col('coordinates'),
                    Sequelize.fn('ST_MakePoint', lng, lat)
                ),
                {$lte: radius}
            );
        }

        return query;
    };

    /**
     * Method to notify the location that a task has been completed.
     * Will update the correct values on the location.
     * @param {Task} task
     * @param {Task} previousTask
     */
    Location.prototype.onTaskCompleted = function(task, previousTask) {
        // Update the location based on the task that was completed
        switch (task.type) {
        case constants.TASK_TYPES.SetLocationName:
            this.name = task.outcome.name;
            break;

        case constants.TASK_TYPES.SetLocationType:
            this.type = task.outcome.locationType;
            break;

        case constants.TASK_TYPES.SetLocationDescription:
            this.description = task.outcome.description;
            break;

        case constants.TASK_TYPES.SetLocationCoordinates:
            // TODO: use setter method for this?
            this.coordinates = utils.createPoint(task.outcome.latitude, task.outcome.longitude);
            break;

        case constants.TASK_TYPES.SetLocationWebsite:
            if (task.outcome.isAvailable) {
                this.website = task.outcome.website;
            }
            else {
                this.website = null;
            }
            break;

        case constants.TASK_TYPES.RateLocationQuality:
            // Replace or add the rating
            if (_.isObject(previousTask)) {
                this.replaceQuality(previousTask.outcome.quality, task.outcome.quality);
            }
            else {
                this.addQuality(task.outcome.quality);
            }
            break;

        case constants.TASK_TYPES.TagLocation:
            var previouslySetTags = _.isObject(previousTask) ? previousTask.outcome.tags : [];
            var newSetTags = task.outcome.tags;
            var locationTags = this.tags;

            // Go through all the newly added tags
            // TODO: helper methods for increasing and decreasing tags
            _.each(_.difference(newSetTags, previouslySetTags), function(addedTag) {
                if (typeof locationTags[addedTag] === 'undefined') {
                    locationTags[addedTag] = 0;
                }
                locationTags[addedTag] += 1;
            });

            // Then decrease all the removed tags
            _.each(_.difference(previouslySetTags, newSetTags), function(removedTag) {
                // Sanity check to make sure this tag really exists (should always be the kind)
                if (typeof locationTags[removedTag] !== 'undefined') {
                    locationTags[removedTag] -= 1;
                    if (locationTags[removedTag] === 0) {
                        delete locationTags[removedTag];
                    }
                }
            });

            // Set the new tags
            this.tags = locationTags;
            break;

        case constants.TASK_TYPES.SetLocationExistence:
            // TODO WIP: what else to do for this task? Delete the place if confirmed enough?
            this.existence = task.outcome.existence;
            break;

        case constants.TASK_TYPES.SetLocationProductListComplete:
            this.productListComplete = task.outcome.completionState;
            break;
        }

        // TODO: only save when something changed?
        // Save the new state
        return this.save();
    };

    /**
     * Convert the location for transferring over the API
     * @returns {{}}
     */
    Location.prototype.toJSON = function() {
        var doc = this.get();
        var ret = _.pick(doc, [
            'name',
            'description',
            'website',
            'type',
            'id',
            'lat',
            'lng',
            'updatedAt',
            'tags',
            'productListComplete'
        ]);

        // Add address if anything is loaded
        // TODO: find a cleaner way for this
        var address = _.omit(_.omit({
            street: doc.addressStreet,
            house: doc.addressHouse,
            postcode: doc.addressPostcode,
            city: doc.addressCity,
            country: doc.addressCountry
        }, _.isNull), _.isUndefined);
        if (Object.keys(address).length > 0) {
            ret.address = address;
        }

        // Add the quality (if it was loaded)
        if (typeof doc.qualityCount !== 'undefined') {
            ret.quality = {
                average: doc.qualityAverage,
                numRatings: doc.qualityCount
            };
        }

        // Add existence (only if not the default existing)
        if (doc.existence !== constants.LOCATION_EXISTENCE_STATES.existing) {
            ret.existence = doc.existence;
        }

        // If the topProductRank was added by the GET /location/list call, expose that too
        if (typeof doc.topProductRank === 'number') {
            ret.topProductRank = doc.topProductRank;
        }

        return _.omit(ret, _.isNull);
    };

    return Location;
};
