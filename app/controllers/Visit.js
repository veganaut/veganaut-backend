'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Person = mongoose.model('Person');
var Location = mongoose.model('Location');
var Visit = mongoose.model('Visit');
var Mission = mongoose.model('Mission');

exports.visit = function(req, res, next) {
    var person, location, visit;
    async.series([
        function (cb) {
            Person.findOne(req.body.person, function (err, p) {
                if (!err && !p) {
                    err = new Error('Could not find person with id: ' + req.body.person);
                }
                person = p;
                cb(err);
            });
        },
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
            visit = new Visit({person: person.id, location: location.id, completed: Date.now()});
            visit.save(cb);
        },
        function (cb) {
            async.map(
                req.body.missions,
                function (values, cb) {
                    var m = new Mission(_.assign(values, {visit: visit.id}));
                    m.save(function (err) {cb(err, m);});
                },
                cb
            );
        },
    ], function(err) {
        if (err) {
            return next(err);
        } else {
            return res.send(visit);
        }
    });
};
