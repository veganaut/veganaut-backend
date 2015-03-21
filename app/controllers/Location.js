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
            coordinates: [req.body.lng, req.body.lat]
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
    Location.find(function(err, locations) {
        if (err) {
            return next(err);
        }

        async.each(locations,
            function(location, cb) {
                if (typeof req.user !== 'undefined') {
                    // TODO: we don't really have to do this here, only in the .get method
                    location.computeLastMissionDates(req.user, cb);
                }
                else {
                    cb();
                }
            },
            function(err) {
                if (err) {
                    return next(err);
                }
                return res.send(locations);
            }
        );
    });
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
    _.merge(obj.location, _.pick(obj.req.body, ['name', 'description', 'link']));
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
    Product.find({location: obj.location.id}, function(err, p) {
        if (p) {
            obj.products = p;
        }
        cb(err, obj);
    }).sort('-ratings.rank -ratings.count name');
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
        // For privacy reasons, we don't include the completed date
        .find({location: locationId}, 'person location points outcome')
        .populate('person', 'team nickname')
        .sort({completed: 'desc'})
        .limit(NUM_COMPLETED_MISSION_LIMIT)
        .exec(function(err, missions) {
            if (!err && (!missions || missions.length === 0)) {
                res.status(404);
                err = new Error('Could not find location with id: ' + locationId);
            }
            if (err) {
                return next(err);
            }

            return res.send(missions);
        })
    ;
};
