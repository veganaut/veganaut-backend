'use strict';

var _ = require('lodash');
var geoip = require('geoip-lite');

/**
 * Returns the current location of user based on her IP
 * @param req
 * @param res
 */
exports.get = function(req, res) {
    // Get client ip. Trust proxies, shouldn't be a problem for this use case
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var geo = geoip.lookup(ip) || {};

    // Add separate fields for latitude and longitude
    if (typeof geo.ll === 'object') {
        geo.lat = geo.ll[0];
        geo.lng = geo.ll[1];
    }

    return res.send(_.pick(geo, [
        'country', 'region', 'lat','lng'
    ]));
};
