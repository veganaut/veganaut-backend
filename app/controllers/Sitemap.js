'use strict';

var _ = require('lodash');
var config = require('../config.js');

var db = require('../models');

/**
 * List of fixed paths in the frontend
 * @type {string[]}
 */
var STATIC_PATHS = [
    '',
    '/panorama/',
    '/map/',
    '/list/',
    '/register',
    '/login'
];

/**
 * Returns the sitemap of the frontend
 * @param req
 * @param res
 * @param next
 */
exports.getSitemap = function(req, res, next) {
    var paths = _.clone(STATIC_PATHS);

    // Find all locations
    db.Location
        .findAll({
            attributes: ['id', 'name']
        })
        .then(function(locations) {
            // Add the location paths
            _.each(locations, function(location) {
                paths.push('/location/' + location.getURLSlug() + '-' + location.id);
            });

            // Render the sitemap.xml manually
            var sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
            sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            _.each(paths, function(url) {
                sitemap += '<url><loc>' + config.frontendUrl + url + '</loc></url>';
            });
            sitemap += '</urlset>';

            // Send as XML
            res.set('Content-Type', 'text/xml');
            res.send(sitemap);
        })
        .catch(next)
    ;
};
