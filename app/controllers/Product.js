'use strict';

var _ = require('lodash');
var utils = require('../utils/utils');
var mongoose = require('mongoose');
var Location = mongoose.model('Location');
var Product = mongoose.model('Product');

// Max, min and default values for the product list request parameters
var LIMIT_MAX_VALUE = 20;
var LIMIT_MIN_VALUE = 1;
var LIMIT_DEFAULT_VALUE = LIMIT_MAX_VALUE;
var SKIP_MIN_VALUE = 0;
var SKIP_DEFAULT_VALUE = SKIP_MIN_VALUE;

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

    // Prepare the response
    var response = {
        products: [],
        totalProducts: 0
    };

    // Read the location type filter
    var locationQuery = {};
    if (typeof req.query.locationType !== 'undefined') {
        locationQuery.type = req.query.locationType;
    }

    // Create the query based on the center and radius
    try {
        var coordinatesQuery = Location.getCenterQuery(req.query.lat, req.query.lng, req.query.radius);
        if (coordinatesQuery) {
            locationQuery.coordinates = coordinatesQuery;
        }
    }
    catch (e) {
        return next(e);
    }

    /**
     * Helper that gets and returns the products with the given query
     * @param {{}} query The query to use to find products
     */
    var doProductQuery = function(query) {
        // Count the products first
        Product.count(query, function(err, count) {
            if (err) {
                return next(err);
            }

            // Set the total products
            response.totalProducts = count;
            if (response.totalProducts === 0) {
                // No products found, send response
                return res.send(response);
            }

            // Find the products
            Product
                .find(query)
                .skip(skip)
                .limit(limit)
                .sort(Product.getDefaultSorting())
                .exec(function(err, products) {
                    response.products = products;
                    return res.send(response);
                })
            ;
        });
    };

    // Find the relevant locations (we always need to run this query even if
    // it's empty here as it will automatically exclude the deleted locations).
    Location
        .find(locationQuery, function(err, locations) {
            if (err) {
                return next(err);
            }

            // Generate list of location ids
            var ids = [];
            _.each(locations, function(location) {
                ids.push(location.id);
            });

            return doProductQuery({
                location: {$in: ids}
            });
        }
    );
};
