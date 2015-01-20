'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Activity = mongoose.model('Activity');

exports.list = function(req, res) {
    Activity
        .find()
        .exec(function(err, activities) {
            if (err) {
                return res.status(500).send({error: err});
            }

            // Set all the properties we want to return
            activities = _.map(activities, function(a) {
                var result = {};
                result.id = a.id;
                result.name = a.name;
                result.className = a.className;
                result.timeLimit = a.timeLimit;

                return result;
            });

            res.send(activities);
        })
    ;
};
