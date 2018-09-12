'use strict';
/**
 * Controller for the Panorama page showing the overview
 * of the locations and activities in a certain area.
 */

var _ = require('lodash');
var BPromise = require('bluebird');
var constants = require('../utils/constants');

var db = require('../models');


/**
 * Gets the statistics on the number and type of locations in the given area.
 *
 * @param {{}} where Where clause for the locations query
 * @return {Promise} Promise that resolves to an object with the properties:
 *      - total: {number}
 *      - gastronomy: {number}
 *      - retail: {number}
 *      - quality: {number[]} Number of location by quality, starting with
 *              quality 0, so unrated, to quality 5
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
 * Gets the statistics on the number and type of products in the given area.
 *
 * @param {{}} where Where clause for the locations query
 * @return {Promise} Promise that resolves to an object with the properties:
 *      - total: {number}
 *      - gastronomy: {number}
 *      - retail: {number}
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
        // Try to get the center (lat/lng) and radius query
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
