'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Missions = require('../models/Missions');
var Location = mongoose.model('Location');
var Person = mongoose.model('Person');
var constants = require('../utils/constants');

// TODO NOW: add tests for the new scores
exports.stats = function(req, res, next) {
    async.parallel([
        // Get number of locations by type
        function(cb) {
            Location.aggregate([
                {
                    $group: {
                        _id: '$type',
                        sum: {$sum: 1}
                    }
                },
                {
                    $sort: {
                        sum: -1,
                        _id: 1
                    }
                }
            ]).exec(function(err, locationStats) {
                var stats = [];
                if (!err) {
                    _.each(locationStats, function(stat) {
                        stats.push({
                            type: stat._id,
                            locations: stat.sum
                        });
                    });
                }

                cb(err, {
                    locationTypes: {
                        locations: stats
                    }
                });
            });
        },

        // Get number of people
        function(cb) {
            Person.count({
                accountType: 'player'
            }).exec(function(err, count) {
                cb(err, {
                    people: {
                        count: count || 0
                    }
                });
            });
        },

        // Get number of missions by person
        function(cb) {
            Missions.Mission.aggregate([
                {
                    $group: {
                        _id: '$person',
                        sum: {$sum: 1}
                    }
                },
                {
                    $sort: {
                        sum: -1,
                        _id: 1
                    }
                }
            ]).exec(function(err, peopleStats) {
                if (err) {
                    return cb(err);
                }

                Person.find({
                    // Only select actual players
                    accountType: constants.ACCOUNT_TYPES.PLAYER
                }, 'nickname', function(err, people) {
                    if (err) {
                        return cb(err);
                    }
                    var peopleById = _.indexBy(people, '_id');
                    var stats = [];
                    _.each(peopleStats, function(stat) {
                        if (typeof peopleById[stat._id] !== 'undefined') {
                            stats.push({
                                person: _.pick(peopleById[stat._id], ['id', 'nickname']),
                                missions: stat.sum
                            });
                        }
                    });
                    cb(null, {
                        people: {
                            missions: stats
                        }
                    });
                });
            });
        }
    ], function(err, results) {
        if (err) {
            return next(err);
        }

        res.send(_.merge.apply(_, results));
    });
};
