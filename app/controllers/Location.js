'use strict';

var _ = require('lodash');
var async = require('async');

var mongoose = require('mongoose');
var Location = mongoose.model('Location');
var Missions = require('../models/Missions');
var Product = require('../models/Product');

/**
 * Number of missions to send in the get completed missions call
 * @type {number}
 */
var NUM_COMPLETED_MISSION_LIMIT = 10;

exports.location = function(req, res, next) {
    var location = new Location(_.assign(
        _.pick(req.body, 'name', 'description', 'link', 'type'),
        {
            coordinates: [req.body.lng, req.body.lat],
            team: req.user.team
        }
    ));

    var mission;
    async.series([
        location.save.bind(location),
        function(cb) {
            // Create the completed addLocation mission
            // TODO: this should probably go in the Location Model pre save or something, then one can also change FixtureCreator.location
            mission = new Missions.AddLocationMission({
                person: req.user.id,
                location: location,
                completed: new Date(),
                outcome: true
            });
            mission.save(cb);
        },
        function(cb) {
            // We take the location instance from the mission, because that one has
            // the correct points calculated
            location = mission.location;
            location.computeLastMissionDates(req.user, cb);
        }
    ], function(err) {
        if (err) {
            return next(err);
        }
        return res.send(location);
    });
};

exports.list = function(req, res, next) {
    // Load the locations, but only the data we actually want to send
    Location.find({}, 'name type coordinates team updatedAt quality efforts',
        function(err, locations) {
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

var computeVisitBonusDate = function(obj, cb) {
    if (typeof obj.req.user !== 'undefined') {
        obj.location.computeLastMissionDates(obj.req.user, function(err) {
            cb(err, obj);
        });
    }
    else {
        cb(null, obj);
    }
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
        computeVisitBonusDate,
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
        computeVisitBonusDate,
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
        .populate('person', 'team nickname')
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

                // Check if this available mission already has a last completed mission defined
                if (typeof availableMission !== 'undefined' && typeof availableMission.lastCompleted === 'undefined') {
                    // Set the completed mission as the last one completed for that available mission
                    availableMission.lastCompleted = completedMission;

                    // If the user got points for completing this mission, take into account
                    // the cool down period. If it's not cooled down yet, set the points to zero.
                    if (completedMission.getTotalAwardedPoints() > 0 && !completedMission.isCooledDown()) {
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
