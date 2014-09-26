'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Missions = require('../models/Missions');
var Product = require('../models/Product');

exports.submit = function(req, res, next) {
    var location, mission, oldTeam;

    // Find the mission model to use
    var MissionModel = Missions.getModelForIdentifier(req.body.type);
    if (typeof MissionModel === 'undefined') {
        return next(new Error('Could not find mission of type: ' + req.body.type));
    }

    // Read the outcome of the mission
    var outcome = req.body.outcome;

    // Do that series TODO: split this up in separate named functions?
    async.series([
        // Find the location where the mission was made
        function(cb) {
            Location.findById(req.body.location, function(err, l) {
                if (!err && !l) {
                    err = new Error('Could not find location with id: ' + req.body.location);
                }
                else {
                    location = l;
                    oldTeam = l.team;
                }
                return cb(err);
            });
        },

        // Create Products if the mission was about products
        function(cb) {
            if (Missions.isProductMission(MissionModel) && _.isArray(outcome)) {
                async.each(outcome, function(o, innerCb) {
                    // Check if we didn't already get an object id
                    if (o.product && !_.isString(o.product)) {
                        o.product = new Product({
                            name: o.product.name,
                            location: location.id
                        });
                        o.product.save(innerCb);
                    }
                    else {
                        // TODO: validate that given product id exists
                        innerCb();
                    }
                }, cb);
            }
            else {
                // Do nothing
                return cb();
            }
        },

        // Create the new mission and save it
        function(cb) {
            // TODO: before saving the visitBonus mission, make sure the user is allowed to complete it
            mission = new MissionModel(_.assign(
                _.pick(req.body, ['location', 'points']),
                {
                    person: req.user.id,
                    location: location.id,
                    outcome: outcome,
                    completed: Date.now()
                }
            ));

            mission.save(cb);
        },

        // Re-load the location (it changed when the mission was saved)
        function(cb) {
            Location.findById(location, function(err, l) {
                if (err) {
                    return cb(err);
                }

                location = l;
                return cb();
            });
        }
    ], function(err) {
        if (err) {
            return next(err);
        }

        var causedOwnerChange = (location.team !== oldTeam);
        var response = _.assign(mission.toApiObject(), {
            causedOwnerChange: causedOwnerChange
        });
        return res.send(201, response);
    });
};
