'use strict';

var async = require('async');
var mongoose = require('mongoose');
var generatePassword = require('password-generator');
var config = require('../config.js');
var mailTransporter = require('../utils/mailTransporter.js');

var Person = mongoose.model('Person');

//see http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

/**
 * Period for which a reset token is valid (depending on type of reset
 * @type {{reset: number, registration: number}}
 */
var TOKEN_VALIDITY_PERIOD = {
    reset:             24 * 60 * 60 * 1000, // 24 hours
    registration: 14 * 24 * 60 * 60 * 1000  // 14 days for registration
};

// TODO: how to do translations in the backend?
/**
 * Text for the e-mails.
 * @type {{reset: {subject: string, text: string}, registration: {subject: string, text: string}}}
 */
var EMAIL_TEXT = {
    reset: {
        subject: 'Veganaut.net Password Reset',
        text: 'Hi {{NAME}}!\n\n' +
        'You are receiving this e-mail because you (or someone else) have requested to reset the password of your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        '{{URL}}\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n\n' +
        'Your Veganaut.net team\n'
    },
    registration: {
        subject: 'Veganaut.net Registration',
        text: 'Hi {{NAME}}!\n\n' +
        'You are receiving this e-mail because you have registered on Veganaut.net.\n\n' +
        'Please click on the following link, or paste this into your browser to set your password:\n\n' +
        '{{URL}}\n\n' +
        'Thanks for registering!\n' +
        'Your Veganaut.net team\n'
    }
};

/**
 * Frontend URL to which to append the reset token to
 * get the full reset URL
 * @type {string}
 */
var RESET_BASE_URL = config.frontendUrl + '/reset/';

exports.send = function (req, res, next) {
    // TODO: implement a way to prevent spamming someone with reset e-mails
    var emailAddress = req.body.email;
    var type = req.body.type;

    // Check if reset type is valid
    if (Object.keys(TOKEN_VALIDITY_PERIOD).indexOf(type) === -1) {
        return next(new Error('Invalid reset type: ' + type));
    }

    async.waterfall([
        function (done) {
            var token = generatePassword(40, false);
            Person.findOne({email: emailAddress}, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    res.status(400);
                    return done(new Error('No account with that email address exists!'));
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + TOKEN_VALIDITY_PERIOD[type];

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var text = EMAIL_TEXT[type].text;
            text = text.replace('{{NAME}}', user.nickname);
            text = text.replace('{{URL}}', RESET_BASE_URL + token);
            var mailOptions = {
                to: user.email,
                from: config.email.from,
                subject: EMAIL_TEXT[type].subject,
                text: text
            };
            mailTransporter.sendMail(mailOptions, function (err) {
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
