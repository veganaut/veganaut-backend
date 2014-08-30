'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

exports.visit = function(req, res, next) {
    var location, visit, bestTeamBefore;
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
            // Load the recent visits
            location.populateRecentVisits(cb);
        },
        function(cb) {
            // Calculate current owner
            location.calculatePoints();
            bestTeamBefore = location._bestTeam;
            return cb();
        },
        function(cb) {
            // Create the new visit and sav it
            // TODO: pick the wanted data from missions (to make sure that points aren't sent for example)
            visit = new Visit({person: req.user.id, location: location.id, completed: Date.now(), missions: req.body.missions});
            visit.save(cb);
        },
        function(cb) {
            // Get all the visits again (including the newly created one)
            location.populateRecentVisits(cb);
        },
        function(cb) {
            // Calculate the new points
            location.calculatePoints();

            // Check if the owner team has changed
            if (location._bestTeam !== bestTeamBefore) {
                causedOwnerChange = true;

                // Owner has changed, save the new info
                location.performOwnerChange(visit);
                return location.save(cb);
            }
            return cb();
        }
    ], function(err) {
        if (err) {
            return next(err);
        }
        else {
            var response = _.assign(visit.toApiObject(), {
                causedOwnerChange: causedOwnerChange
            });
            return res.send(201, response);
        }
    });
};
