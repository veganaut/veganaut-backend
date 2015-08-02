'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Missions = require('../models/Missions');
var Person = mongoose.model('Person');
var constants = require('../utils/constants');

// TODO: add new types of stats (now that we don't have teams any longer)
exports.stats = function(req, res, next) {
    async.parallel([
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
                        // TODO NOW: should we flatten the response now that teams are gone?
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
