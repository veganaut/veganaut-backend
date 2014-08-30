'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

exports.visit = function(req, res, next) {
    var location, visit, oldTeam;
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
            // Re-load the location (it changed when the visit was saved)
            Location.findById(location, function(err, l) {
                if (err) { return cb(err); }

                location = l;
                return cb();
            });
        },
    ], function(err) {
        if (err) { return next(err); }

        var causedOwnerChange = (location.team !== oldTeam);
        var response = _.assign(visit.toApiObject(), {
            causedOwnerChange: causedOwnerChange
        });
        return res.send(201, response);
    });
};
