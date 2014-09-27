'use strict';

/**
 * Returns the current location of user based on her IP
 * @param req
 * @param res
 * @param next
 */
exports.get = function(req, res, next) {
    var geoip = require('geoip-lite');

    var ip = req.connection.remoteAddress;
    var geo = geoip.lookup(ip);
    
    // Add separate fields for latitude and longitude
    if (geo !== null && typeof geo.ll === 'object') {
        geo.lat = geo.ll[0];
        geo.lng = geo.ll[1];
    }
    else {
        // default location is Bern
        geo = { 'lat': 46.95, 'lng': 7.45 };
    }

    return res.send(geo);
};









