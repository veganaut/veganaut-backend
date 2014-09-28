'use strict';

var geoip = require('geoip-lite');

/**
 * Returns the current location of user based on her IP
 * @param req
 * @param res
 */
exports.get = function(req, res) {
    var ip = req.connection.remoteAddress;
    var geo = geoip.lookup(ip) || {};
    
    // Add separate fields for latitude and longitude
    if (typeof geo.ll === 'object') {
        geo.lat = geo.ll[0];
        geo.lng = geo.ll[1];
    }

    return res.send(geo);
};









