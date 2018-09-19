/**
 * Generic helper module
 */
'use strict';

var utils = {};

/**
 * Regex to match a decimal number (string that contains only 0-9)
 * @type {RegExp}
 */
utils.DECIMAL_NUMBER_REGEX = /^[0-9]+$/;

/**
 * Regex to match a hexadecimal number (string that contains only 0-9, a-f, A-F)
 * Note that a decimal number also tests successfully with that regex.
 * @type {RegExp}
 */
utils.HEXADECIMAL_NUMBER_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Checks if the given value is a positive integer (only digits).
 * Returns the value as a number if it's the case and false otherwise
 * @param {string} value
 * @returns {number|false}
 */
utils.strictParsePositiveInteger = function(value) {
    if (/^[0-9]+$/.test(value)) {
        return Number(value);
    }
    return false;
};

/**
 * Calculates the geohash (string representing the coordinates) of the given
 * latitude and longitude.
 *
 * Adapted from https://github.com/davetroy/geohash-js
 * Originally it would use base32, we use base4 because we want
 * the precision to increase more gradually the more letters are considered.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string}
 */
utils.calculateGeoHash = function(latitude, longitude) {
    // Length of geohash to calculate
    var precision = 20;

    // Initial bounds in which the given lat/lng is found (= the whole world)
    var latBounds = {
        lower: -90,
        upper: 90
    };
    var lngBounds = {
        lower: -180,
        upper: 180
    };
    var quadrant = 0;
    var geohash = '';

    // Iterate until we got the desired precision
    var lngMid, latMid;
    while (geohash.length < precision) {
        // Calculate the quadrant in which the coordinates lie
        // (the quadrant is encoded in a base 4 number)
        lngMid = (lngBounds.lower + lngBounds.upper) / 2;
        if (longitude > lngMid) {
            quadrant += 2;
            lngBounds.lower = lngMid;
        }
        else {
            lngBounds.upper = lngMid;
        }

        latMid = (latBounds.lower + latBounds.upper) / 2;
        if (latitude > latMid) {
            quadrant += 1;
            latBounds.lower = latMid;
        }
        else {
            latBounds.upper = latMid;
        }

        // Add the current quadrant to the hash
        geohash += quadrant.toString();
        quadrant = 0;
    }

    return geohash;
};

/**
 * Returns a GeoJSON point from the given longitude and latitude
 * @param {number} lat
 * @param {number} lng
 * @returns {{type: string, coordinates: [number,number]}}
 */
utils.createPoint = function(lat, lng) {
    return {
        type: 'Point',
        coordinates: [lng, lat]
    };
};

/**
 * Converts a hexadecimal location id from MongoDB times to the new id
 * used with Postgres.
 * @param {string} mongoDbId
 * @returns {number}
 */
utils.convertLocationMongoDbIdToPostgresId = function(mongoDbId) {
    // Simple hashing function to convert the ids, has no collisions on the set of ids
    // that existed at time of migration. Don't ask...
    return Math.round(parseInt(mongoDbId.substr(0, 12), 16) / 1000000) - 91000000;
};

module.exports = utils;
