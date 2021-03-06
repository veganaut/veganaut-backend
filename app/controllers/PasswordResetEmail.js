'use strict';

var generatePassword = require('password-generator');
var config = require('../config.js');
var db = require('../models');
var mailTransporter = require('../utils/mailTransporter.js');

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
        'Best,\n' +
        'Sebu\n'
    },
    registration: {
        subject: 'Veganaut.net Registration',
        text: 'Hi {{NAME}}!\n\n' +
        '(Deutsch unten. Français en bas.) You are receiving this e-mail because you have registered on Veganaut.net.\n\n' +
        'Please click on the following link (or paste it into your browser) to set your password:\n\n' +
        '{{URL}}\n\n' +
        'This will enable you to log in again and to share your vegan discoveries with other Veganauts!\n\n' +
        'Cheers,\n' +
        'Sebu\n\n\n' +
        'Hallo {{NAME}}!\n\n' +
        'Du erhälst diese Mail, weil du dich auf Veganaut.net registriert hast.\n\n' +
        'Klicke auf den folgenden Link (oder kopiere ihn in deinen Browser), um dein Passwort zu setzen:\n\n' +
        '{{URL}}\n\n' +
        'Damit kannst du dich wieder einloggen und deine veganen Entdeckungen mit anderen Veganaut*innen teilen!\n\n' +
        'Prost und guten Appetit!\n' +
        'Sebu\n\n\n' +
        'Salut {{NAME}}!\n\n' +
        'Tu reçois ce mail parce que tu t\'es inscrit sur Veganaut.net.\n\n' +
        'Clique sur ce lien (ou copie-le dans ton browser) pour saisir ton mot de passe:\n\n' +
        '{{URL}}\n\n' +
        'Cela te permettera de te reconnecter et de partager tes découvertes véganes avec les autres Véganautes.\n\n' +
        'À la tienne et bon app!\n' +
        'Sebu\n'
    }
};

/**
 * Frontend URL to which to append the reset token to
 * get the full reset URL
 * @type {string}
 */
var RESET_BASE_URL = config.frontendUrl + '/reset/';

exports.send = function(req, res, next) {
    // TODO: implement a way to prevent spamming someone with reset e-mails
    var emailAddress = req.body.email;
    var type = req.body.type;

    // Check if reset type is valid
    if (Object.keys(TOKEN_VALIDITY_PERIOD).indexOf(type) === -1) {
        return next(new Error('Invalid reset type: ' + type));
    }

    var token = generatePassword(40, false);
    db.Person.findOne({where: {email: emailAddress}})
        .then(function(user) {
            if (!user) {
                res.status(400);
                throw new Error('No account with that email address exists!');
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + TOKEN_VALIDITY_PERIOD[type];

            return user.save();
        })
        .then(function(user) {
            var text = EMAIL_TEXT[type].text;
            text = text.replace(/\{\{NAME\}\}/g, user.nickname);
            text = text.replace(/\{\{URL\}\}/g, RESET_BASE_URL + token);
            var mailOptions = {
                to: user.email,
                from: config.email.from,
                subject: EMAIL_TEXT[type].subject,
                text: text
            };

            return mailTransporter.sendMail(mailOptions);
        })
        .then(function() {
            res.status(200).send({status: 'OK'});
        })
        .catch(next)
    ;
};
