'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Activity = mongoose.model('Activity');

exports.list = function(req, res) {
    Activity
        .find()
        .exec(function(err, activities) {
            if (err) {
                return res.send(500, {error: err});
            }

            // Set all the properties we want to return
            activities = _.map(activities, function(a) {
                var result = {};
                result.id = a.id;
                result.name = a.name;
                result.className = a.className;
                result.timeLimit = a.timeLimit;
                result.givesVegBytes = a.givesVegBytes;

                return result;
            });

            res.send(activities);
        })
    ;
};
