'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');

exports.visit = function(req, res, next) {
    var location, visit;
    async.series([
        function (cb) {
            Location.findById(req.body.location, function (err, l) {
                if (!err && !l) {
                    err = new Error('Could not find location with id: ' + req.body.location);
                }
                location = l;
                cb(err);
            });
        },
        function (cb) {
            visit = new Visit({person: req.user.id, location: location.id, completed: Date.now(), missions: req.body.missions});
            visit.save(cb);
        },
    ], function(err) {
        if (err) {
            return next(err);
        } else {
            var missions = _.map(visit.missions, function (m) {return _.pick(m, ['id', 'type', 'outcome', 'points']);});
            return res.send(_.assign(_.pick(visit, ['id', 'person', 'location', 'completed']), {missions: missions}));
        }
    });
};
