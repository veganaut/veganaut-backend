/**
 * Small helper module for repeated crypto tasks
 */
'use strict';

var crypto = require('crypto');

var cryptoUtils = {};

/**
 *
 * @param {string} plainToken
 * @returns {string}
 */
cryptoUtils.hashResetToken = function(plainToken) {
    var shasum = crypto.createHash('sha1');
    shasum.update(plainToken);
    return shasum.digest('hex');
};

module.exports = cryptoUtils;
