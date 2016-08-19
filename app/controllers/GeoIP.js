'use strict';

var _ = require('lodash');
var geoip = require('geoip-lite');

// Load the country data (names and coordinates)
var countryData = require('../data/countryData');

/**
 * List of languages supported by the location lookup.
 * TODO: move to somewhere more global
 * @type {string[]}
 */
var LANGUAGES = ['en', 'de', 'fr'];

/**
 * Returns the current location of user based on her IP
 * @param req
 * @param res
 */
exports.get = function(req, res) {
    // Get client ip. Trust proxies, shouldn't be a problem for this use case
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var geo = geoip.lookup(ip) || {};
    var countryCode = geo.country;

    // Get the request language to give the correct name to the country.
    // TODO: language handling should be done globally by the API
    var requestLanguage = req.query.lang;
    if (!_.contains(LANGUAGES, requestLanguage)) {
        requestLanguage = LANGUAGES[0];
    }

    return res.send(_.assign({
        countryCode: countryCode,
        countryName: countryData.names[requestLanguage][countryCode]
    }, countryData.coordinates[countryCode]));
};
