'use strict';

var _ = require('lodash');
var async = require('async');
var constants = require('../utils/constants');
var utils = require('../utils/utils');

var mongoose = require('mongoose');
var Location = mongoose.model('Location');
var Missions = require('../models/Missions');
var Product = require('../models/Product');

/**
 * Minimum cluster level (same as zoom levels used by leaflet)
 * @type {number}
 */
var CLUSTER_LEVEL_MIN = 0;

/**
 * Maximum cluster level (same as zoom levels used by leaflet)
 * For levels bigger than that, we don't do clustering.
 * (When zoomed in quite a lot, we show all locations.)
 * @type {number}
 */
var CLUSTER_LEVEL_MAX = 13;

/**
 * Number of top locations to return when getting the clustered
 * location list.
 * @type {number}
 */
var NUM_TOP_LOCATIONS = 15;

/**
 * Number of missions to send in the get completed missions call
 * @type {number}
 */
var NUM_COMPLETED_MISSION_LIMIT = 10;

/**
 * Helper method to populate the owner of a location.
 * @param {object} obj Should have a "location" poperty holding the location to populate
 * @param {function} cb
 */
var populateOwner = function(obj, cb) {
    obj.location.populate('owner', 'id nickname', function(err) {
        cb(err, obj);
    });
};

/**
 * Helper method that send a location as a response with the
 * data aggregated on obj.
 * @param err
 * @param obj
 */
var handleSingleLocationResult = function(err, obj) {
    if (err) {
        return obj.next(err);
    }
    var returnObj = obj.location.toJSON();

    // Add the products
    returnObj.products = obj.products;

    // Remove the back reference to the location
    _.each(returnObj.products, function(product) {
        product.location = undefined;
    });

    return obj.res.send(returnObj);
};

/**
 * Returns a word describing the size of the cluster at the
 * given zoom level.
 *
 * TODO: find a better place for this code
 * @param {number} clusterSize
 * @param {number} clusterLevel
 * @returns {string}
 */
var getClusterSizeName = function(clusterSize, clusterLevel) {
    var invertedZoomLevel = 18 - clusterLevel;
    if (clusterSize > invertedZoomLevel * 3) {
        return 'large';
    }
    else if (clusterSize > invertedZoomLevel) {
        return 'medium';
    }
    else if (clusterSize > 1) {
        return 'small';
    }
    else {
        return 'tiny';
    }
};

/**
 * Calculates and returns the location clusters for the given level.
 *
 * @param {Location[]} locations List of locations to cluster
 *      Assumes that the locations have a property "geoHash" set.
 * @param {number} clusterLevel Already validated clustering levle
 * @param {Person} [user] User for which to get the clusters.
 *      Used to "numOwned" property on the cluster
 * @returns {Array}
 */
var getLocationClusters = function(locations, clusterLevel, user) {
    // Calculate precision (number of characters of the location has to use)
    // Slightly more precise than the top locations to have more clusters
    var precisionClusters = clusterLevel + 3;

    var locationGroupsClusters = _.groupBy(locations, function(location) {
        return location.geoHash.substring(0, precisionClusters);
    });

    // Calculating clusters
    var allClusterData = _.map(locationGroupsClusters, function(cluster, clusterId) {
        var clusterData = {
            id: clusterId,
            lat: 0,
            lng: 0
        };
        _.each(cluster, function(loc) {
            clusterData.lat += loc.coordinates[1];
            clusterData.lng += loc.coordinates[0];

            // TODO: Add tests to make sure this works correctly? Or will this be removed too soon?
            if (typeof user === 'object') {
                clusterData.numOwned = clusterData.numOwned || 0;
                if (('' + loc.owner) === ('' + user.id)) {
                    clusterData.numOwned += 1;
                }
            }
        });

        clusterData.clusterSize = cluster.length;
        clusterData.sizeName = getClusterSizeName(clusterData.clusterSize, clusterLevel);
        clusterData.lat /= clusterData.clusterSize;
        clusterData.lng /= clusterData.clusterSize;

        return clusterData;
    });

    return allClusterData;
};

/**
 * Roughly clusters the given locations, selects the top location of
 * every cluster and then returns the overall highest ranked locations.
 * This gives a spread out set of highly ranked locations.
 *
 * @param {Location[]} locations
 * @param {number} clusterLevel
 * @returns {Location[]}
 */
var getSpreadTopLocations = function(locations, clusterLevel) {
    // Calculate precision (number of characters of the location has to use)
    // Slightly less precise than the clusters to not have many overlapping top locations
    var precisionTopLocation = clusterLevel + 2;

    // Group the locations by their cluster
    var locationGroupsTopLocations = _.groupBy(locations, function(location) {
        return location.geoHash.substring(0, precisionTopLocation);
    });

    // Calculating top locations
    var topLocations = _.map(locationGroupsTopLocations, function(cluster) {
        return _.reduce(cluster, function(topLoc, loc) {
            // TODO: accessing quality is dominating the execution time of this whole method
            // (well actually the db access is doing that of course)
            if (loc.quality.rank > topLoc.quality.rank) {
                return loc;
            }
            else {
                return topLoc;
            }
        });
    });

    // Sort by rank and pick the top ones
    topLocations = _.sortByOrder(topLocations, 'quality.rank', 'desc');
    topLocations = _.take(topLocations, NUM_TOP_LOCATIONS);

    return topLocations;
};

/**
 * Create a new location
 * @param req
 * @param res
 * @param next
 */
exports.create = function(req, res, next) {
    // This is called 'obj' because it's just nothing really. Need to find a better
    // way to compose these async methods. TODO: Probably just need to switch to promises
    var obj = {
        req: req,
        res: res,
        next: next
    };

    var location = new Location(_.assign(
        _.pick(req.body, 'name', 'description', 'link', 'type'),
        {
            coordinates: [req.body.lng, req.body.lat],
            owner: req.user
        }
    ));

    var mission;
    async.waterfall([
        function(cb) {
            location.save(function(err) {
                obj.location = location;
                cb(err, obj);
            });
        },
        function(obj, cb) {
            // Create the completed addLocation mission
            // TODO: this should probably go in the Location Model pre save or something, then one can also change FixtureCreator.location
            mission = new Missions.AddLocationMission({
                person: req.user.id,
                location: location,
                completed: new Date(),
                outcome: true
            });
            mission.save(function(err) {
                // We take the location instance from the mission, because that one has
                // the correct points calculated
                obj.location = mission.location;
                cb(err, obj);
            });
        },
        populateOwner
    ], handleSingleLocationResult);
};

/**
 * Returns lists of locations. These can either be full lists in the given
 * bounds or clustered locations with only the top locations returned as such.
 *
 * @param req
 * @param res
 * @param next
 */
exports.list = function(req, res, next) {
    // Create the query based on the bounding box or coordinate/radius.
    // If no query is provided, all locations are loaded
    var query = {};
    var coordinates;

    try {
        // Try to get the bounding box query first
        coordinates = Location.getBoundingBoxQuery(req.query.bounds);

        // If there was no bounding box, try the center (lat/lng) and radius query
        if (!coordinates) {
            coordinates = Location.getCenterQuery(req.query.lat, req.query.lng, req.query.radius);
        }
    }
    catch (e) {
        return next(e);
    }

    // Set the coordinates query if one was found
    if (coordinates) {
        query.coordinates = coordinates;
    }

    // Add location type to the query if valid value given
    if (constants.LOCATION_TYPES.indexOf(req.query.type) > -1) {
        query.type = req.query.type;
    }

    // Add updated within restriction to the query if valid value given
    var updatedWithin = parseInt(req.query.updatedWithin, 10);
    if (!isNaN(updatedWithin) && updatedWithin > 0) {
        query.updatedAt = {
            $gt: new Date(Date.now() - (updatedWithin * 1000))
        };
    }

    // Get the cluster level and make sure it's either undefined or in the valid levels
    // If a value outside the bounds is given, we won't do clustering
    var clusterLevel = parseInt(req.query.clusterLevel, 10);
    if (isNaN(clusterLevel) ||
        clusterLevel < CLUSTER_LEVEL_MIN ||
        clusterLevel > CLUSTER_LEVEL_MAX)
    {
        clusterLevel = undefined;
    }

    // Load the locations, but only the data we actually want to send
    Location.find(query, 'name type coordinates quality owner')
        .exec(function(err, locations) {
            if (err) {
                return next(err);
            }

            // Prepare response object
            var response = {};

            // Check if we got a cluster level for which we do clustering
            if (_.isNumber(clusterLevel)) {
                // Calculate the geo hash of every location
                // TODO: pre-calculate and store in db
                _.each(locations, function(location) {
                    location.geoHash = utils.calculateGeoHash(location.coordinates[1], location.coordinates[0]);
                });

                // Get the top locations and the clusters
                response.locations = getSpreadTopLocations(locations, clusterLevel);
                response.clusters = getLocationClusters(locations, clusterLevel, req.user);
            }
            else {
                // No clustering wanted by the requester or level too high that clustering makes sense
                response.locations = locations;
            }

            return res.send(response);
        }
    );
};

// TODO WIP: document
exports.search = function(req, res, next) {
    var searchString = req.query.query;
    var limit = parseInt(req.query.limit, 10) || 10;

    Location
        .find(
            {
                $text: { $search: searchString }
            },
            {
                searchScore: { $meta: 'textScore' },
                name: 1,
                type: 1,
                quality: 1
            }
        )
        .sort({
            searchScore: { $meta : 'textScore' },
            'quality.rank': 'desc'
        })
        .limit(limit)
        .exec(function(err, locations) {
            if (err) {
                return next(err);
            }

            return res.send(locations);
        }
    );
};


// TODO: this is so ugly I'm gonna die. How does one handle this async callback mess while staying sane?

var findLocation = function(obj, cb) {
    var locationId = obj.req.params.locationId;
    Location.findById(locationId, function(err, location) {
        if (!err && !location) {
            obj.res.status(404);
            err = new Error('Could not find location with id: ' + locationId);
        }

        obj.location = location;
        cb(err, obj);
    });
};

var updateLocation = function(obj, cb) {
    var locationData = obj.req.body;
    _.merge(obj.location, _.pick(locationData, ['name', 'description', 'link', 'type']));

    // Set coordinates if they are given
    if (typeof locationData.lng === 'number') {
        obj.location.coordinates[0] = locationData.lng;
        obj.location.markModified('coordinates');
    }
    if (typeof locationData.lat === 'number') {
        obj.location.coordinates[1] = locationData.lat;
        obj.location.markModified('coordinates');
    }

    // Save the new data
    obj.location.save(function(err) {
        cb(err, obj);
    });
};

var findProducts = function(obj, cb) {
    obj.products = [];
    Product
        .find({location: obj.location.id})
        .sort(Product.getDefaultSorting())
        .exec(function(err, p) {
            if (p) {
                obj.products = p;
            }
            cb(err, obj);
        })
    ;
};

/**
 * Returns an individual Location with the id given in
 * req.params.locationId
 * @param req
 * @param res
 * @param next
 */
exports.get = function(req, res, next) {
    // This is called 'obj' because it's just nothing really. Need to find a better
    // way to compose these async methods. TODO: Probably just need to switch to promises
    var obj = {
        req: req,
        res: res,
        next: next
    };

    async.waterfall([
        function(cb) {
            findLocation(obj, cb);
        },
        populateOwner,
        findProducts
    ], handleSingleLocationResult);
};

/**
 * Updates the location with id req.params.locationId
 * @param req
 * @param res
 * @param next
 */
exports.update = function(req, res, next) {
    var obj = {
        req: req,
        res: res,
        next: next
    };

    async.waterfall([
        function(cb) {
            findLocation(obj, cb);
        },
        updateLocation,
        populateOwner,
        findProducts
    ], handleSingleLocationResult);
};

/**
 * Returns the latest completed missions at a location
 * @param req
 * @param res
 * @param next
 */
exports.getCompletedMissions = function(req, res, next) {
    var locationId = req.params.locationId;
    Missions.Mission
    // Get missions at this location that are not from NPCs
    // For privacy reasons, we don't include the completed date
        .find({
            location: locationId,
            isNpcMission: false
        }, 'person location points outcome')
        .populate('person', 'nickname')
        .sort({completed: 'desc'})
        .limit(NUM_COMPLETED_MISSION_LIMIT)
        .exec(function(err, missions) {
            // TODO: should return a 404 when the location doesn't exist at all
            if (err) {
                return next(err);
            }

            return res.send(missions);
        })
    ;
};

/**
 * Compiles a list of all missions that are available to the current user
 * at a certain location. The last completed missions of that player are
 * also included.
 * TODO: this whole code should be merged with the Mission model code to calculate the points for a single mission
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.getAvailableMissions = function(req, res, next) {
    // TODO: should return a 404 when the location doesn't exist at all
    var locationId = req.params.locationId;

    // TODO: move this helper somewhere more central
    var handleError = function(err) {
        return next(err);
    };

    // Query to find all the products of this location
    var productQuery = Product.find({
        location: locationId
    }, 'id').exec();

    // Query to find all the completed missions at this location
    var missionQuery = Missions.Mission.find({
        location: locationId,
        person: req.user.id
    }, 'id completed outcome points type').sort({
        completed: 'desc'
    }).exec();

    productQuery.then(function(products) {
        // Create the list of available location missions
        var locationMissions = {};
        _.each(Missions.locationMissionModels, function(missionModel) {
            // Only add the BuyOptionsMission if there are products
            // TODO: the mission should know itself when it's available
            // TODO: this is untested
            if (missionModel !== Missions.BuyOptionsMission ||
                products.length > 0)
            {
                locationMissions[missionModel.getIdentifier()] = {
                    points: missionModel.getMaxPoints()
                };
            }
        });

        // Create list of all available missions for every product
        var productMissions = {};
        _.each(products, function(product) {
            productMissions[product.id] = {};
            _.each(Missions.productMissionModels, function(missionModel) {
                productMissions[product.id][missionModel.getIdentifier()] = {
                    points: missionModel.getMaxPoints()
                };
            });
        });

        // Get all the completed missions
        // TODO: actually, we only need the last completed mission and last mission with more than 0 points of every type
        missionQuery.then(function(completedMissions) {
            // Go through the completed missions
            _.each(completedMissions, function(completedMission) {
                // Find the corresponding available mission definition
                var availableMission;
                if (completedMission.isProductModifyingMission()) {
                    availableMission = productMissions[completedMission.outcome.product][completedMission.constructor.getIdentifier()];
                }
                else {
                    availableMission = locationMissions[completedMission.constructor.getIdentifier()];
                }

                // Check if we found an available mission
                if (typeof availableMission !== 'undefined') {
                    // Check if this available mission already has a last completed mission defined
                    if (typeof availableMission.lastCompleted === 'undefined') {
                        // Set the completed mission as the last one completed for that available mission
                        // TODO: we don't really need to send the id and type of the mission
                        availableMission.lastCompleted = completedMission;
                    }

                    // If the user got points for completing this mission, take into account
                    // the cool down period. If it's not cooled down yet, set the points to zero.
                    if (completedMission.points > 0 && !completedMission.isCooledDown()) {
                        availableMission.points = 0;
                    }
                }
            });

            // Sent the available location and product missions
            return res.send({
                locationMissions: locationMissions,
                productMissions: productMissions
            });
        }, handleError);
    }, handleError);
};
