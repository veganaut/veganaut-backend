'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');
var Mission = mongoose.model('Mission');

exports.visit = function(req, res, next) {
    var location, visit, missions;
    async.series([
        function (cb) {
            Location.findOne(req.body.location, function (err, l) {
                if (!err && !l) {
                    err = new Error('Could not find person with id: ' + req.body.location);
                }
                location = l;
                cb(err);
            });
        },
        function (cb) {
            visit = new Visit({person: req.user.id, location: location.id, completed: Date.now()});
            visit.save(cb);
        },
        function (cb) {
            async.map(
                req.body.missions,
                function (values, cb) {
                    var m = new Mission(_.assign(values, {visit: visit.id}));
                    m.save(function (err) {cb(err, _.pick(m, ['id', 'type', 'outcome']));});
                },
                function (err, ms) {
                    missions = ms;
                    cb(err);
                }
            );
        },
    ], function(err) {
        if (err) {
            return next(err);
        } else {
            return res.send(_.assign(_.pick(visit, ['id', 'person', 'location', 'completed']), {missions: missions}));
        }
    });
};
