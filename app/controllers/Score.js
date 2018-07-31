'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var constants = require('../utils/constants');
var db = require('../models');


/**
 * Returns all people of accountType player indexed by id.
 * Only the nickname and id is returned.
 */
var getPlayersById = function() {
    return db.Person
        .findAll({
            attributes: ['id', 'nickname'],
            // Only select actual players
            where: {accountType: constants.ACCOUNT_TYPES.player}
        })
        .then(function(people) {
            return _.indexBy(people, 'id');
        });
};

/**
 * Gets the number of locations by type.
 * @return {Promise}
 */
var getLocationCountByType = function() {
    return db.Location
        .findAll({
            attributes: [
                'type',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['type'],
            order: [
                ['count', 'DESC']
            ]
        })
        .then(function(results) {
            return results.map(function(result) {
                return {
                    type: result.get('type'),
                    locations: parseInt(result.get('count'), 10)
                };
            });
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
 * Gets the ranking of the players by completed tasks.
 * @param playerByIdPromise
 * @return {Promise}
 */
var getTasksCountByPlayer = function(playerByIdPromise) {
    var tasksByPlayerPromise = db.Task.findAll({
        attributes: [
            'personId',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['personId'],
        order: [
            ['count', 'DESC']
        ]
    });

    return BPromise.join(
        tasksByPlayerPromise, playerByIdPromise,
        function(peopleStats, playersById) {
            var stats = [];
            _.each(peopleStats, function(stat) {
                var personId = stat.get('personId');
                if (typeof playersById[personId] !== 'undefined') {
                    stats.push({
                        person: _.pick(playersById[personId], ['id', 'nickname']),
                        tasks: parseInt(stat.get('count'), 10)
                    });
                }
            });

            return stats;
        }
    );
};

exports.stats = function(req, res, next) {
    var playerByIdPromise = getPlayersById();

    // TODO WIP: Simply show the world area overview page instead of the community page (with maybe some additional info)
    BPromise.join(
        getLocationCountByType(),
        getPlayerCount(playerByIdPromise),
        getTasksCountByPlayer(playerByIdPromise),
        function(locationCount, playerCount, tasksByPlayer) {
            // Assemble it all up
            return {
                locationTypes: {
                    locations: locationCount
                },
                people: {
                    count: playerCount,
                    tasks: tasksByPlayer
                }
            };
        }
    )
        .then(res.send.bind(res))
        .catch(next)
    ;
};
