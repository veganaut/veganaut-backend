'use strict';

var _ = require('lodash');
var config = require('../config.js');

var mongoose = require('mongoose');
var Location = mongoose.model('Location');

/**
 * List of fixed paths in the frontend
 * @type {string[]}
 */
var STATIC_PATHS = [
    '',
    '/map/',
    '/locations/',
    '/register',
    '/login'
];

/**
 * Returns the sitemap of the frontend
 * @param req
 * @param res
 */
exports.getSitemap = function(req, res) {
    var paths = _.clone(STATIC_PATHS);

    // Find all locations
    Location.find({}, '_id', function(err, locations) {
        // Add the location paths
        if (!err && _.isArray(locations)) {
            _.each(locations, function(location) {
                paths.push('/location/' + location.id);
            });
        }

        // Render the sitemap.xml manually
        var sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        _.each(paths, function(url) {
            sitemap += '<url><loc>' + config.frontendUrl + url + '</loc></url>';
        });
        sitemap += '</urlset>';

        // Send as XML
        res.set('Content-Type', 'text/xml');
        res.end(sitemap);
    });
};
