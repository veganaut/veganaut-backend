'use strict';

var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

exports.visit = function(req, res, next) {
    var location, visit;
    async.series([
        function(cb) {
            Location.findById(req.body.location, function(err, l) {
                if (!err && !l) {
                    err = new Error('Could not find location with id: ' + req.body.location);
                }
                location = l;
                cb(err);
            });
        },
        function(cb) {
            // TODO: pick the wanted data from missions (to make sure that points aren't sent for example)
            visit = new Visit({person: req.user.id, location: location.id, completed: Date.now(), missions: req.body.missions});
            visit.save(cb);
        }
    ], function(err) {
        if (err) {
            return next(err);
        }
        else {
            return res.send(201, visit.toApiObject());
        }
    });
};
