'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Missions = require('../models/Missions');
var Location = mongoose.model('Location');
var Person = mongoose.model('Person');
var constants = require('../utils/constants');

/**
 * Completes a team statistics object to contain all the teams.
 * Missing teams will be added with 0 entries.
 * @param {{}} stats
 * @param {string} statName Name of the field that contains the  statis value
 */
function addMissingTeamsToStats(stats, statName) {
    // Check if we don't already have all teams
    if (stats.length !== constants.PLAYER_TEAMS.length) {
        // Collect all the teams that are already in the list
        var addedTeams = [];
        _.each(stats, function(stat) {
            addedTeams.push(stat.team);
        });

        // Add the remaining teams
        _.each(constants.PLAYER_TEAMS, function(team) {
            if (addedTeams.indexOf(team) === -1) {
                // Create a 0-entry for this missing team
                var stat = {
                    team: team
                };
                stat[statName] = 0;
                stats.push(stat);
            }
        });
    }
}

exports.stats = function(req, res, next) {
    async.parallel([
        // Get number of locations by team
        function(cb) {
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

                    // Make sure all teams have an entry
                    addMissingTeamsToStats(stats, 'locations');
                }

                cb(err, {
                    teams: {
                        locations: stats
                    }
                });
            });
        },
        // Get number of people by team
        function(cb) {
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

                    // Make sure all teams have an entry
                    addMissingTeamsToStats(stats, 'people');
                }

                cb(err, {
                    teams: {
                        people: stats
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

                Person.find({}, 'nickname team', function(err, people) {
                    if (err) {
                        return cb(err);
                    }
                    var peopleById = _.indexBy(people, '_id');
                    var stats = [];
                    _.each(peopleStats, function(stat) {
                        if (typeof peopleById[stat._id] !== 'undefined') {
                            stats.push({
                                person: _.pick(peopleById[stat._id], ['id', 'nickname', 'team']),
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
