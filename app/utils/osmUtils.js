/**
 * Helper methods for Open Street Map data and APIs.
 */
'use strict';

var _ = require('lodash');
var https = require('https');


/**
 * OSM properties that are mapped to our "city" address part.
 * @type {string[]}
 */
var CITY_PROPS = ['city', 'town', 'village', 'hamlet', 'suburb', 'state', 'county', 'city_district'];

/**
 * OSM properties that are mapped to our "street" address part.
 * @type {string[]}
 */
var STREET_PROPS = ['road', 'footway', 'pedestrian', 'path', 'cycleway'];

/**
 * User agent string that we use for contacting the OSM APIs.
 * @type {string}
 */
var VEGANAUT_BOT_AGENT = 'VeganautNetBot/0.1 (+https://blog.veganaut.net/contact/)';

// Prepare the object to export
var osmUtils = {};

/**
 * Retrieves an address from the OSM Nominatim API at the given coordinates.
 * @param {string} lat
 * @param {string} lng
 * @param {function} cb TODO: Switch to promises
 */
osmUtils.osmAddressLookup = function(lat, lng, cb) {
    // TODO: error handling: should be logged somewhere!
    https.get({
        hostname: 'nominatim.openstreetmap.org',
        path: '/reverse?accept-language=en&addressdetails=true&format=json&lat=' + lat + '&lon=' + lng,
        headers: {
            'User-Agent': VEGANAUT_BOT_AGENT
        }
    }, function(resp) {
        resp.setEncoding('utf8');

        // Check if request was successful
        if (resp.statusCode !== 200) {
            return cb(new Error('Got error from OSM Nominatim: ' + resp.statusCode));
        }

        var rawData = '';
        resp.on('data', function(chunk) {
            rawData += chunk;
        });
        resp.on('end', function() {
            var data;
            try {
                data = JSON.parse(rawData);
            }
            catch (e) {}

            if (typeof data === 'undefined') {
                return cb(new Error('Could not parse response from OSM Nominatim.'));
            }
            else {
                return cb(null, data);
            }
        });
    }).on('error', function(e) {
        return cb(new Error('Got error searching OSM Nominatim: ' + e.message));
    });
};

/**
 * Converts an address from OSM to a veganaut one with the following properties:
 * street, houseNumber, city, postcode, country
 * @param {{}} osmAddress
 * @returns {{}}
 */
osmUtils.convertFromOsmAddress = function(osmAddress) {
    var osmProps = Object.keys(osmAddress);

    var address = {
        addressCountry: osmAddress.country,
        addressPostcode: osmAddress.postcode
    };

    // Find the best "city"
    var cityPropsFound = _.intersection(CITY_PROPS, osmProps);
    if (cityPropsFound.length > 0) {
        address.addressCity = osmAddress[cityPropsFound[0]];

        // If suburb is used, add also the state (the data seems to make the most sense like this)
        if (cityPropsFound[0] === 'suburb' && typeof osmAddress.state !== 'undefined') {
            address.addressCity += ', ' + osmAddress.state;
        }
    }

    // Find the best "street"
    var streetPropsFound = _.intersection(STREET_PROPS, osmProps);
    if (streetPropsFound.length > 0) {
        address.addressStreet = osmAddress[streetPropsFound[0]];

        // Add also the house if we found the street
        address.addressHouse = osmAddress['house_number'];
    }

    return address;
};

module.exports = osmUtils;
