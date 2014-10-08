'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Missions = require('../models/Missions');
var Location = mongoose.model('Location');
var Person = mongoose.model('Person');

exports.stats = function(req, res, next) {
    async.parallel([
        function(cb) {
            // Get number of locations by team
            Location.aggregate([
                {
                    $group: {
                        _id: '$team',
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
                            team: stat._id,
                            locations: stat.sum
                        });
                    });
                }

                cb(err, {
                    teams: {
                        locations: stats
                    }
                });
            });
        },
        function(cb) {
            // Get number of people by team
            Person.aggregate([
                // TODO: this selects only people that actually have an account. This implementation details should stay in the Person model
                {
                    $match: {
                        password: {$exists: true}
                    }
                },
                {
                    $group: {
                        _id: '$team',
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
                var stats = [];
                if (!err) {
                    _.each(peopleStats, function(stat) {
                        stats.push({
                            team: stat._id,
                            people: stat.sum
                        });
                    });
                }

                cb(err, {
                    teams: {
                        people: stats
                    }
                });
            });
        },
        function(cb) {
            // Get number of missions by person
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

                Person.find({}, 'nickname team', function(err, people) {
                    if (err) {
                        return cb(err);
                    }
                    var peopleById = _.indexBy(people, '_id');
                    var stats = [];
                    _.each(peopleStats, function(stat) {
                        if (typeof peopleById[stat._id] !== 'undefined') {
                            stats.push({
                                person: _.pick(peopleById[stat._id], ['nickname', 'team']),
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
