'use strict';

var _ = require('lodash');
var utils = require('../utils/utils');
var db = require('../models');

// Max, min and default values for the product list request parameters
var LIMIT_MAX_VALUE = 20;
var LIMIT_MIN_VALUE = 1;
var LIMIT_DEFAULT_VALUE = LIMIT_MAX_VALUE;
var SKIP_MIN_VALUE = 0;
var SKIP_DEFAULT_VALUE = SKIP_MIN_VALUE;

/**
 * Helper that gets and returns the products with the given query
 * @param {{}} whereQuery The where query to use to find products
 * @param {number} limit
 * @param {number} skip
 * @returns {Promise}
 */
var findProducts = function(whereQuery, limit, skip) {
    // Prepare the response
    var response = {
        products: [],
        totalProducts: 0
    };

    // Count the products first
    return db.Product.count({where: whereQuery}).then(function(count) {
        // Set the total products
        response.totalProducts = count;
        if (response.totalProducts === 0) {
            // No products found, return early
            return response;
        }

        // Find the products
        return db.Product
            .findAll({
                where: whereQuery,
                limit: limit,
                offset: skip,
                order: db.Product.getDefaultSorting()
            })
            .then(function(products) {
                response.products = products;
                return response;
            });
    });
};

exports.list = function(req, res, next) {
    // Check if we got a limit in the request
    var limit = LIMIT_DEFAULT_VALUE;
    if (typeof req.query.limit !== 'undefined') {
        // Try to parse and check the value
        limit = utils.strictParsePositiveInteger(req.query.limit);
        if (limit === false || limit > LIMIT_MAX_VALUE || limit < LIMIT_MIN_VALUE) {
            return next(new Error('Parameter "limit" should be a number between ' +
                LIMIT_MIN_VALUE + ' and ' + LIMIT_MAX_VALUE)
            );
        }
    }

    // Check if we got a skip value in the request
    var skip = SKIP_DEFAULT_VALUE;
    if (typeof req.query.skip !== 'undefined') {
        // Try to parse and check the value
        skip = utils.strictParsePositiveInteger(req.query.skip);
        if (skip === false || skip < SKIP_MIN_VALUE) {
            return next(new Error('Parameter "skip" should be a number bigger or equal to ' +
                SKIP_MIN_VALUE)
            );
        }
    }

    // Prepare the where clauses
    var locationWhereClauses = [];

    // Read the location type filter
    if (typeof req.query.locationType !== 'undefined') {
        locationWhereClauses.push({
            type: req.query.locationType
        });
    }

    // Create the query based on the center and radius
    try {
        var coordWhere = db.Location.getCenterQuery(req.query.lat, req.query.lng, req.query.radius);
        if (coordWhere) {
            locationWhereClauses.push(coordWhere);
        }
    }
    catch (e) {
        return next(e);
    }

    // Find the relevant locations (we always need to run this query even if
    // it's empty here as it will automatically exclude the deleted locations).
    db.Location
        .findAll({
            attributes: ['id'],
            where: {$and: locationWhereClauses}
        })
        .then(function(locations) {
            // Generate list of location ids
            var ids = _.map(locations, _.property('id'));

            return findProducts({
                locationId: {$in: ids}
            }, limit, skip);
        })
        .then(function(response) {
            res.send(response);
        })
        .catch(next)
    ;
};
