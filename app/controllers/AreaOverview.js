'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var constants = require('../utils/constants');

var db = require('../models');


/**
 * TODO WIP: document (and move to a model?)
 * TODO WIP: write tests
 * @param where
 * @return {Promise}
 */
var getLocationCounts = function(where) {
    var roundedQuality = db.sequelize.literal(
        'round("qualityTotal"::float / NULLIF("qualityCount", 0))'
    );

    var initialCounts = {
        total: 0,
        quality: [0, 0, 0, 0, 0, 0]
    };
    _.each(constants.LOCATION_TYPES, function(type) {
        initialCounts[type] = 0;
    });

    return db.Location
        .findAll({
            where: where,
            attributes: [
                'type',
                [roundedQuality, 'roundedQuality'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['type', roundedQuality],
            raw: true
        })
        .then(function(dbCounts) {
            return _.reduce(
                dbCounts,
                function(result, dbCount) {
                    var count = parseInt(dbCount.count, 10);
                    result.total += count;
                    result[dbCount.type] += count;

                    // Add to number of location per quality, default to 0 if null (= locations with no rating yet)
                    result.quality[dbCount.roundedQuality || 0] += count;
                    return result;
                },
                initialCounts
            );
        });
};

/**
 * TODO WIP: document (and move to a model?)
 * @param where
 * @return {Promise}
 */
var getProductCounts = function(where) {
    var initialCounts = {
        total: 0
    };
    _.each(constants.LOCATION_TYPES, function(type) {
        initialCounts[type] = 0;
    });

    return db.Location
        .findAll({
            where: where,
            attributes: [
                'type',
                [db.sequelize.fn('COUNT', db.sequelize.col('location.id')), 'count']
            ],
            include: [{
                model: db.Product,
                attributes: [],
                where: {} // Add a where clause to get Sequelize to do an inner join (we only want locations that have products)
            }],
            group: ['location.type'],
            raw: true
        })
        .then(function(dbCounts) {
            return _.reduce(
                dbCounts,
                function(result, dbCount) {
                    var count = parseInt(dbCount.count, 10);
                    result.total += count;
                    result[dbCount.type] += count;
                    return result;
                },
                initialCounts
            );
        });
};

/**
 * Get the overview of how many locations and products of what
 * types and quality there is in an area (coordinates/radius)
 * @param req
 * @param res
 * @param next
 */
exports.get = function(req, res, next) {
    // Create the where clause based on coordinates/radius.
    // If no query is provided, overview of the whole world is provided
    var coordWhere;
    try {
        // Tre center (lat/lng) and radius query
        coordWhere = db.Location.getCenterQuery(req.query.lat, req.query.lng, req.query.radius);
    }
    catch (e) {
        return next(e);
    }

    BPromise.join(
        getLocationCounts(coordWhere),
        getProductCounts(coordWhere),
        function(locationCount, productCount) {
            return {
                locations: locationCount,
                products: productCount
            };
        }
    )
        .then(res.send.bind(res))
        .catch(next)
    ;
};
