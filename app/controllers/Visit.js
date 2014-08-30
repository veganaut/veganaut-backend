'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

exports.visit = function(req, res, next) {
    var location, visit;
    var causedOwnerChange = false;
    async.series([
        function(cb) {
            Location.findById(req.body.location, function(err, l) {
                if (!err && !l) {
                    err = new Error('Could not find location with id: ' + req.body.location);
                }
                location = l;
                return cb(err);
            });
        },
        function(cb) {
            // Create the new visit and save it

            // Sanitize missions
            var missions = _.map(req.body.missions, function(m) {
                return _.pick(m, ['type', 'outcome']);
            });

            visit = new Visit({
                person: req.user.id,
                location: location.id,
                completed: Date.now(),
                missions: missions
            });
            visit.save(cb);
        },
        function(cb) {
            // Update the score of the location
            var points = location.computeCurrentPoints();
            var availablePoints = location.computeCurrentAvailablePoints();
            var team = location.team;
            var teamPoints = points[team];

            _.each(visit.missions, function(mission) {
                _.forOwn(mission.points, function(p, t) {
                    points[t] += p;
                    availablePoints -= p;
                });
            });

            _.forOwn(points, function(t) {
                if (points[t] > teamPoints) {
                    team = t;
                    teamPoints = points[t];
                }
            });
            causedOwnerChange = (location.team !== team);

            location.points = points;
            location.availablePoints = availablePoints;
            location.team = team;
            location.updatedAt = Date.now();
            location.save(cb);
        }
    ], function(err) {
        if (err) { return next(err); }
        else {
            var response = _.assign(visit.toApiObject(), {
                causedOwnerChange: causedOwnerChange
            });
            return res.send(201, response);
        }
    });
};
