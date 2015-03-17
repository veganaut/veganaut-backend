/**
 * Generic helper module
 */
'use strict';

var utils = {};

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

module.exports = utils;
