'use strict';

var async = require('async');
var crypto = require('crypto');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var config = require('../config.js');

var Person = mongoose.model('Person');

//see http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

/**
 * Period for which a reset token is valid: 24 hours
 * @type {number}
 */
var TOKEN_VALIDITY_PERIOD = 24 * 360000;

/**
 * Frontend URL to which to append the reset token to
 * get the full reset URL
 * @type {string}
 */
var RESET_BASE_URL = config.frontendUrl + '/reset/';

exports.send = function (req, res, next) {

    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            Person.findOne({email: req.body.email}, function (err, user) {
                if (!user) {
                    res.status(404);
                    return next(new Error('No account with that email address exists!'));
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + TOKEN_VALIDITY_PERIOD;

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var transporter = nodemailer.createTransport(config.email.transporter);
            // TODO: how to do translations in the backend?
            var mailOptions = {
                to: user.email,
                from: config.email.from,
                subject: 'veganaut.net Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                RESET_BASE_URL + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            transporter.sendMail(mailOptions, function (err) {
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) {
            return next(err);
        }
        return res.status(200).send();
    });
};
