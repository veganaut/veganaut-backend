'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var mongoose = require('mongoose');
var Missions = require('../models/Missions');
var Location = mongoose.model('Location');
var Person = mongoose.model('Person');
var constants = require('../utils/constants');

var findPeople = BPromise.promisify(Person.find, Person);

/**
 * Returns all people of accountType player indexed by id.
 * Only the nickname and id is returned.
 */
var getPlayersById = function() {
    return findPeople({
        // Only select actual players
        accountType: constants.ACCOUNT_TYPES.PLAYER
    }, 'nickname')
        .then(function(people) {
            return _.indexBy(people, '_id');
        })
    ;
};

/**
 * Gets the number of locations by type.
 * @return {Promise}
 */
var getLocationCountByType = function() {
    var query = Location.aggregate([
        {
            $match: Location.getBaseQuery()
        },
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
    ]);

    return BPromise.promisify(query.exec, query)().then(function(locationStats) {
        var stats = [];
        _.each(locationStats, function(stat) {
            stats.push({
                type: stat._id,
                locations: stat.sum
            });
        });
        return stats;
    });
};

/**
 * Returns the number of players.
 * The returned object can be merged to be returned in the stats API call.
 * @param playerByIdPromise
 * @return {Promise}
 */
var getPlayerCount = function(playerByIdPromise) {
    return playerByIdPromise.then(function(playersById) {
        return Object.keys(playersById).length;
    });
};

/**
 * Gets the ranking of the players by completed missions.
 * @param playerByIdPromise
 * @return {Promise}
 */
var getMissionsCountByPlayer = function(playerByIdPromise) {
    var query = Missions.Mission.aggregate([
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
    ]);

    return BPromise.join(
        BPromise.promisify(query.exec, query)(), playerByIdPromise,
        function(peopleStats, playersById) {
            var stats = [];
            _.each(peopleStats, function(stat) {
                if (typeof playersById[stat._id] !== 'undefined') {
                    stats.push({
                        person: _.pick(playersById[stat._id], ['id', 'nickname']),
                        missions: stat.sum
                    });
                }
            });

            return stats;
        }
    );
};

/**
 * Gets the ranking of the players by owned locations.
 * @param playerByIdPromise
 * @return {Promise}
 */
var getLocationCountByPlayer = function(playerByIdPromise) {
    var query = Location.aggregate([
        {
            $match: Location.getBaseQuery()
        },
        {
            $group: {
                _id: '$owner',
                sum: {$sum: 1}
            }
        },
        {
            $sort: {
                sum: -1,
                _id: 1
            }
        }
    ]);

    return BPromise.join(
        BPromise.promisify(query.exec, query)(), playerByIdPromise,
        function(ownerStats, playersById) {
            var stats = [];
            _.each(ownerStats, function(stat) {
                if (typeof playersById[stat._id] !== 'undefined') {
                    stats.push({
                        person: _.pick(playersById[stat._id], ['id', 'nickname']),
                        locations: stat.sum
                    });
                }
            });

            return stats;
        }
    );
};

exports.stats = function(req, res, next) {
    var playerByIdPromise = getPlayersById();

    BPromise.join(
        getLocationCountByType(),
        getPlayerCount(playerByIdPromise),
        getMissionsCountByPlayer(playerByIdPromise),
        getLocationCountByPlayer(playerByIdPromise),
        function(locationCount, playerCount, missionsByPlayer, locationsByPlayer) {
            // Assemble it all up
            return {
                locationTypes: {
                    locations: locationCount
                },
                people: {
                    count: playerCount,
                    missions: missionsByPlayer,
                    locations: locationsByPlayer
                }
            };
        }
    )
        .then(res.send.bind(res))
        .catch(next)
    ;
};
