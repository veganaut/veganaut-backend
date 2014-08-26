'use strict';

var _ = require('lodash');
var async = require('async');

var mongoose = require('mongoose');
var Location = mongoose.model('Location');

exports.location = function(req, res, next) {
    var location = new Location(req.body);
    location.save(function(err) {
        if (err) {
            return next(err);
        }
        else {
            return res.send(location);
        }
    });
};


exports.list = function(req, res, next) {
    Location.find(function(err, locations) {
        if (err) {
            return next(err);
        }

        async.each(locations, function(location, cb) {
            location.populateRecentVisits(function(err) {
                cb(err);
            });
        }, function() {
            locations = _.map(locations, function(l) {
                l.calculatePoints();
                return l.toApiObject();
            });
            return res.send(locations);
        });
    });
};
