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
var BOUNDING_BOX_MAX_LNG = 180;

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
        totalProducts: 0,
        includesWholeWorld: false
    };

    // Checks if coordinates are sent
    var coordsQuery;
    var bounds = req.query.bounds;
    if (typeof bounds === 'string') {
        bounds = bounds.split(',');

        // Checks if every item is a valid number
        var invalidBounds = false;
        bounds = _.map(bounds, function(x) {
            var b = parseFloat(x);
            if (isNaN(b)) {
                invalidBounds = true;
            }
            return b;
        });

        if (invalidBounds) {
            return next(new Error('Bounds are invalid'));
        }

        // Only set the coordinates if the bounding box is not too big
        if (Math.abs(bounds[2] - bounds[0]) < BOUNDING_BOX_MAX_LNG) {
            var box = [
                [bounds[0], bounds[1]],
                [bounds[2], bounds[3]]
            ];
            coordsQuery = {
                coordinates: {
                    $within: {$box: box}
                }
            };
        }
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
                .sort('-ratings.rank -ratings.count name')
                .exec(function(err, products) {
                    response.products = products;
                    return res.send(response);
                })
            ;
        });
    };

    // Check if the coords query was set
    if (typeof coordsQuery === 'undefined') {
        // If no coords are given, find all products
        response.includesWholeWorld = true;
        return doProductQuery({});
    }
    else {
        // Find the locations withing the given coords
        Location
            .find(coordsQuery, function(err, locations) {
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
    }
};
