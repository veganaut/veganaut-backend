'use strict';

var async = require('async');
var crypto = require('crypto');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');

var Person = mongoose.model('Person');

//see http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

/**
 * Period for which a reset token is valid: 24 hours
 * @type {number}
 */
var TOKEN_VALIDITY_PERIOD = 24 * 360000;

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
            //TODO: not contacting MX servers directly, likely to be seen as spam by the mail servers...
            var smtpTransport = nodemailer.createTransport();
            //TODO: the way to get the frontend URL is ugly
            var mailOptions = {
                to: user.email,
                from: 'noreply@veganaut.net',
                subject: 'veganaut.net Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host.replace('3000', '8000') + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
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
