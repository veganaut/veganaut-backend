'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var constants = require('../utils/constants');
var utils = require('../utils/utils');
var taskDefinitions = require('../utils/taskDefinitions');

var db = require('../models');

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
 * @returns {Array}
 */
var getLocationClusters = function(locations, clusterLevel) {
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
            clusterData.lat += loc.lat;
            clusterData.lng += loc.lng;
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
 * @param {string} rankFieldName Name of the field to use for ranking
 * @returns {Location[]}
 */
var getSpreadTopLocations = function(locations, clusterLevel, rankFieldName) {
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
            if (loc.get(rankFieldName) > topLoc.get(rankFieldName)) {
                return loc;
            }
            else {
                return topLoc;
            }
        });
    });

    // Sort by rank and pick the top ones
    topLocations = _.sortByOrder(topLocations, function(loc) {
        return loc.get(rankFieldName);
    }, 'desc');
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
    // Build the new location
    var location = db.Location.build(_.assign(
        _.pick(req.body, 'name', 'type'),
        {
            coordinates: utils.createPoint(req.body.lat, req.body.lng)
        }
    ));

    location.save()
        .then(function() {
            // Create the completed AddLocation task
            return db.Task.create({
                type: constants.TASK_TYPES.AddLocation,
                locationId: location.id,
                personId: req.user.id,
                outcome: {
                    locationAdded: true
                }
            });
        })
        .then(function(addLocationTask) {
            // Create the triggered tasks that are implied when creating a location
            var baseProperties = {
                triggeredById: addLocationTask.id,
                locationId: location.id,
                personId: req.user.id
            };

            return BPromise.all([
                db.Task.create(_.defaults({
                    type: constants.TASK_TYPES.SetLocationName,
                    outcome: {
                        name: location.name
                    }
                }, baseProperties)),

                db.Task.create(_.defaults({
                    type: constants.TASK_TYPES.SetLocationType,
                    outcome: {
                        locationType: location.type
                    }
                }, baseProperties)),

                db.Task.create(_.defaults({
                    type: constants.TASK_TYPES.SetLocationCoordinates,
                    outcome: {
                        latitude: location.lat,
                        longitude: location.lng
                    }
                }, baseProperties))
            ]);
        })
        .then(function() {
            return res.send(location);
        })
        .catch(next)
    ;
};

/**
 * Returns lists of locations. These can either be full lists in the given
 * bounds or clustered locations with only the top locations returned as such.
 * TODO: Split this up and document all parameters clearly
 *
 * @param req
 * @param res
 * @param next
 */
exports.list = function(req, res, next) {
    // Create the where clause based on the bounding box or coordinate/radius.
    // If no query is provided, all locations are loaded
    var coordWhere;
    try {
        // Try to get the bounding box query first
        coordWhere = db.Location.getBoundingBoxQuery(req.query.bounds);

        // If there was no bounding box, try the center (lat/lng) and radius query
        if (!coordWhere) {
            coordWhere = db.Location.getCenterQuery(req.query.lat, req.query.lng, req.query.radius);
        }
    }
    catch (e) {
        return next(e);
    }

    // Prepare the where clauses
    var whereClauses = [];

    // Set the coordinates query if one was found
    if (coordWhere) {
        whereClauses.push(coordWhere);
    }

    // Add location type to the query if valid value given
    if (constants.LOCATION_TYPES.indexOf(req.query.type) > -1) {
        whereClauses.push({type: req.query.type});
    }

    // Add updated within restriction to the query if valid value given
    var updatedWithin = parseInt(req.query.updatedWithin, 10);
    if (!isNaN(updatedWithin) && updatedWithin > 0) {
        whereClauses.push({
            updatedAt: {
                $gt: new Date(Date.now() - (updatedWithin * 1000))
            }
        });
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

    // Check whether there is clustering
    var useClustering = _.isNumber(clusterLevel);

    // Prepare the params for the findAll call
    var findAllParams = {};

    // If there is no clustering, use limit and skip
    if (!useClustering) {
        findAllParams.limit = utils.strictParsePositiveInteger(req.query.limit);
        findAllParams.offset = utils.strictParsePositiveInteger(req.query.skip);
        if (!_.isNumber(findAllParams.limit)) {
            findAllParams.limit = undefined;
        }
        if (!_.isNumber(findAllParams.offset)) {
            findAllParams.offset = undefined;
        }
    }

    // Define the fields we have to load
    findAllParams.attributes = ['id', 'name', 'type', 'coordinates'];

    // Check if and which part of the address should be loaded
    if (req.query.addressType === 'city') {
        findAllParams.attributes.push('addressCity');
    }
    else if (req.query.addressType === 'street') {
        findAllParams.attributes = findAllParams.attributes.concat(['addressStreet', 'addressHouse']);
    }

    // Check if we are ranking by location quality or by product rating
    var rankFieldName;
    if (req.query.group === 'product') {
        rankFieldName = 'topProductRank';

        // To get the locations by top products, we need to join the products
        // and order by the highest product rating rank
        findAllParams.attributes.push(
            [db.sequelize.fn(
                'COALESCE',
                db.sequelize.fn('MAX', db.sequelize.col('products.ratingRank')),
                -1
            ), 'topProductRank']
        );

        findAllParams.order = [
            [db.sequelize.literal('"topProductRank"'), 'DESC'],
            ['name', 'ASC']
        ];

        findAllParams.include = [{
            model: db.Product,
            attributes: []
        }];

        findAllParams.group = ['location.id'];
    }
    else { // Default to group 'location'
        rankFieldName = 'qualityRank';
        findAllParams.attributes = findAllParams.attributes.concat(['qualityTotal', 'qualityCount', 'qualityRank']);

        findAllParams.order = [
            ['qualityRank', 'DESC'],
            ['qualityCount', 'DESC'],
            ['name', 'ASC']
        ];
    }

    // Create the where query from the list of clauses
    var whereQuery = {
        $and: whereClauses
    };
    findAllParams.where = whereQuery;

    // Count the total locations first
    db.Location.count({where: whereQuery})
        .then(function(count) {
            // Prepare response object
            var response = {
                totalLocations: count
            };

            // Load the locations, but only the data we actually want to send
            db.Location.findAll(findAllParams)
                .then(function(locations) {
                    // Check if we got a cluster level for which we do clustering
                    if (useClustering) {
                        // Calculate the geo hash of every location
                        // TODO: pre-calculate and store in db
                        _.each(locations, function(location) {
                            location.geoHash = utils.calculateGeoHash(location.lat, location.lng);
                        });

                        // Get the top locations and the clusters
                        response.locations = getSpreadTopLocations(locations, clusterLevel, rankFieldName);
                        response.clusters = getLocationClusters(locations, clusterLevel);
                    }
                    else {
                        // No clustering wanted by the requester or level too high that clustering makes sense
                        response.locations = locations;
                    }

                    res.send(response);
                })
                .catch(next)
            ;
        })
        .catch(next)
    ;
};

/**
 * Searches for locations by a string. Searched the name and description.
 * Parameters read from the request:
 * - query: string to search for
 * - limit: number of locations to return, defaults to 10, maximum 50
 *
 * @param req
 * @param res
 * @param next
 */
exports.search = function(req, res, next) {
    var searchString = req.query.query;
    var limit = parseInt(req.query.limit, 10);

    // Check validity of query string
    if (!_.isString(searchString) || searchString.length < 1) {
        res.status(400);
        return next(new Error('Must provide a query string.'));
    }

    // Set default limit and make sure it's not above the max
    if (!_.isNumber(limit) || isNaN(limit) || limit <= 0) {
        limit = 10;
    }
    limit = Math.min(limit, 50);

    // Find the locations
    db.Location
        .findAll({
            attributes: ['id', 'name', 'type', 'qualityTotal', 'qualityCount', 'qualityRank', 'addressCity'],
            where: db.Location.getSearchQuery(searchString),
            limit: limit
            // TODO WIP: order!
        })
        .then(function(data) {
            // console.log(data);
            return res.send(data);
        })
        .catch(next)
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
    var locationId = req.params.locationId;
    var location;

    // Load the location by id
    db.Location.findById(locationId)
        .then(function(foundLocation) {
            location = foundLocation;
            if (!location) {
                // Gracefully handle location not found
                res.status(404);
                throw new Error('Could not find location with id: ' + locationId);
            }

            // Load the products of this location
            return location.getProducts({
                attributes:  {
                    exclude: ['locationId']
                },
                order: db.Product.getDefaultSorting()
            });
        })
        .then(function(products) {
            var returnObj = location.toJSON();

            // Add the products
            returnObj.products = products;

            return res.send(returnObj);
        })
        .catch(next)
    ;
};

/**
 * Returns the next suggested tasks for the user at the given location
 * TODO WIP: document all this, refactor it and unit test it
 * @param req
 * @param res
 * @param next
 */
exports.getSuggestedTask = function(req, res, next) {
    var locationId = req.params.locationId;
    var personId = req.user.id;

    var queries = {};

    var RANDOM_FACTOR = 50;
    var NUM_TASK_TO_SUGGEST = 3;

    queries.userHasBeenThere = db.Task.hasPersonBeenAtLocation(personId, locationId);

    queries.completedTaskInfos = db.sequelize
        .query('SELECT t1.type,' +
            // Using FLOOR to get a number and not a string
            ' FLOOR(COUNT(t1.*)) as "numDone",' +

            // Note: this doesn't account for daylight saving, but we don't care, it's just a rough value
            ' FLOOR(EXTRACT(EPOCH FROM AGE(now(), max(t1."createdAt"))) / 86400) as "daysSinceLastDone",' +
            ' FLOOR(EXTRACT(EPOCH FROM AGE(now(), max(t2."userLastDone"))) / 86400) as "daysSinceUserLastDone"' +
            ' FROM tasks AS t1' +

            ' LEFT JOIN' +
            ' (' +
            '    SELECT "type", MAX("createdAt") as "userLastDone"' +
            '    FROM tasks' +
            '    WHERE "locationId" = ' + db.sequelize.escape(locationId) +
            '        AND "personId" = ' + db.sequelize.escape(personId) +
            '    GROUP BY type' +
            ' ) t2' +
            ' ON t1.type = t2.type' +

            ' WHERE t1."locationId" = ' + db.sequelize.escape(locationId) +
            ' GROUP BY t1.type;'
        )
    ;

    BPromise.props(queries)
        .then(function(results) {
            // Sequelize somehow wraps this in an extra array, dunno why
            var completedTaskInfos = _.indexBy(results.completedTaskInfos[0], 'type');

            // Whether the user knows this place from having been there
            var userHasBeenThere = results.userHasBeenThere;

            var finalResult = [];

            _.each(taskDefinitions, function(definition, type) {
                // Skip global tasks
                if (definition.mainSubject === 'global') {
                    return;
                }

                // Set default values when we didn't get anything from the DB
                var numDone = 0;
                var daysSinceLastDone = Infinity;
                var daysSinceUserLastDone = Infinity;
                if (completedTaskInfos[type]) {
                    if (typeof completedTaskInfos[type].numDone === 'number') {
                        numDone = completedTaskInfos[type].numDone;
                    }
                    if (typeof completedTaskInfos[type].daysSinceLastDone === 'number') {
                        daysSinceLastDone = completedTaskInfos[type].daysSinceLastDone;
                    }
                    if (typeof completedTaskInfos[type].daysSinceUserLastDone === 'number') {
                        daysSinceUserLastDone = completedTaskInfos[type].daysSinceUserLastDone;
                    }
                }

                var AGE_FACTOR = 90;
                var MAX_DAYS_UNTIL_STALE = 180;
                var MAX_STALE_ADDEND = 100;
                var MISSING_CONFIRMATION_FACTOR = 100;
                var volatility = Math.max(1, Math.min(100, 100 * (1 - definition.daysUntilStale / MAX_DAYS_UNTIL_STALE))); // Number between 1 and 100

                // TODO WIP: should only take into account the confirmations of the current value
                // TODO WIP: do this differently for non-info tasks
                var numConfirmationsMissing = Math.max(3 - numDone, 0);
                var confirmationsMissingAddend = 0;
                if (numConfirmationsMissing > 0) {
                    confirmationsMissingAddend = MAX_STALE_ADDEND + MISSING_CONFIRMATION_FACTOR * numConfirmationsMissing;

                }

                var daysStale = Math.max(daysSinceLastDone - definition.daysUntilStale, 0);
                var staleAddend = 0;
                if (numConfirmationsMissing === 0) {
                    staleAddend = Math.ceil(Math.min(MAX_STALE_ADDEND, daysStale / AGE_FACTOR * volatility));
                }

                var importanceAddend = definition.importance;

                var randomAddend = Math.round(RANDOM_FACTOR * Math.random());

                // TODO WIP: don't even bother calculating if this will set it to 0
                var isConfirmedAndNotStaleFactor = 1;
                if (numConfirmationsMissing === 0 && daysStale === 0) {
                    isConfirmedAndNotStaleFactor = 0;
                }

                var requiresFamiliarityFactor = 1;
                if (!userHasBeenThere && definition.requiredFamiliarity > 0) {
                    requiresFamiliarityFactor = 0;
                }

                // Check if the user has done this task already recently
                var userRecentlyDoneFactor = 1;
                if (daysSinceUserLastDone < definition.daysUntilStale) {
                    userRecentlyDoneFactor = 0;
                }

                var finalFactor = (confirmationsMissingAddend + staleAddend + importanceAddend + randomAddend) *
                    isConfirmedAndNotStaleFactor * requiresFamiliarityFactor * userRecentlyDoneFactor
                ;

                finalResult.push({
                    type: type,
                    factor: finalFactor
                });
            });

            var sortedTasks = _.sortByOrder(finalResult, 'factor', 'desc');

            res.send(_.pluck(_.take(sortedTasks, NUM_TASK_TO_SUGGEST), 'type'));
        })
        .catch(next)
    ;
};
