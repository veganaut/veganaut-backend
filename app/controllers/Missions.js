'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Missions = require('../../app/models/Missions');

exports.submit = function(req, res, next) {
    var location, mission, oldTeam;
    async.series([
        function(cb) {
            Location.findById(req.body.location, function(err, l) {
                if (!err && !l) {
                    err = new Error('Could not find location with id: ' + req.body.location);
                }
                location = l;
                oldTeam = l.team;
                return cb(err);
            });
        },
        function(cb) {
            // Find the mission model to use
            var MissionModel = Missions.getModelForIdentifier(req.body.type);
            if (typeof MissionModel === 'undefined') {
                return cb(new Error('Could not find mission of type: ' + req.body.type));
            }

            // Create the new mission and save it
            // TODO: before saving the visitBonus mission, make sure the user is allowed to complete it
            mission = new MissionModel(_.assign(
                _.pick(req.body, ['location', 'outcome', 'points']),
                {
                    person: req.user.id,
                    location: location.id,
                    completed: Date.now()
                }
            ));
            mission.save(cb);
        },
        function(cb) {
            // Re-load the location (it changed when the mission was saved)
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
