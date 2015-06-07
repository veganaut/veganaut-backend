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
    var MissionModel = Missions.Mission.getModelForIdentifier(req.body.type);
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

        // TODO: before saving, make sure the user is allowed to complete it

        // Create Products if the mission is a WhatOptionsMission
        function(cb) {
            if (MissionModel === Missions.WhatOptionsMission && _.isArray(outcome)) {
                async.each(outcome, function(o, innerCb) {
                    // Create a new product
                    o.product = new Product({
                        name: o.product.name,
                        location: location.id
                    });
                    o.product.save(innerCb);
                }, cb);
            }
            else {
                // Do nothing
                return cb();
            }
        },

        // Create the new mission and save it
        function(cb) {
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

        // De-populate the person
        mission.person = mission.person.id;

        // Depopulate the location, don't want to send that
        // TODO: there should be a better way of doing that
        mission.location = location.id;
        var response = _.assign(mission.toJSON(), {
            causedOwnerChange: causedOwnerChange
        });
        return res.status(201).send(response);
    });
};
