'use strict';

var mongoose = require('mongoose');
var Location = mongoose.model('Location');

exports.location = function (req, res, next) {
    var location = new Location(req.body);
    location.save(function (err) {
        if (err) {
            return next(err);
        } else {
            return res.send(location);
        }
    });
};


exports.list = function (req, res, next) {
    Location
        .find()
        .exec(function(err, activities) {
            if (err) {
                return next(err);
            } else {
                return res.send(activities);
            }
        })
    ;
};
