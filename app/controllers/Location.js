'use strict';

var _ = require('lodash');
var async = require('async');

var mongoose = require('mongoose');
var Location = mongoose.model('Location');
var Missions = require('../models/Missions');
var Product = require('../models/Product');

exports.location = function(req, res, next) {
    var location = new Location(_.assign(_.pick(req.body, 'name', 'type'), {
        coordinates: [req.body.lat, req.body.lng]
    }));

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
            location.computeNextVisitBonusDate(req.user, cb);
        }
    ], function(err) {
        if (err) {
            return next(err);
        }
        return res.send(location.toApiObject(req.user));
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
                    location.computeNextVisitBonusDate(req.user, cb);
                }
                else {
                    cb();
                }
            },
            function(err) {
                if (err) { return next(err); }
                locations = _.map(locations, function(l) {
                    return l.toApiObject(req.user);
                });
                return res.send(locations);
            });
    });
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
    var location, products = [];

    async.series([
        // Find the location
        function(cb) {
            Location.findById(locationId, function(err, l) {
                if (!err && !l) {
                    res.status(404);
                    err = new Error('Could not find location with id: ' + locationId);
                }
                location = l;
                cb(err);
            });
        },

        // Compute visit bonus date
        function(cb) {
            if (typeof req.user !== 'undefined') {
                location.computeNextVisitBonusDate(req.user, cb);
            }
            else {
                cb();
            }
        },

        // Find all products
        function(cb) {
            Product.find({location: location.id}, function(err, p) {
                if (p) {
                    products = p;
                }
                cb(err);
            });
        }
    ], function(err) {
        if (err) {
            return next(err);
        }
        var returnObj = location.toApiObject(req.user);
        returnObj.products = products;
        return res.send(returnObj);
    });
};
