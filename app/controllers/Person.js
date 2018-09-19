/**
 * A controller for our people :)
 */

'use strict';

var _ = require('lodash');
var db = require('../models');
var Session = require('./Session');
var cryptoUtils = require('../utils/cryptoUtils');

/**
 * Register a new user
 * @param req
 * @param res
 * @param next
 */
exports.register = function(req, res, next) {
    // Create person from the posted data
    db.Person.create(_.pick(req.body, 'email', 'nickname', 'locale'))
        .then(function(person) {
            // Create a session and reply with that
            // Not very RESTful, but it's what we need here. It would be too
            // complicated to get a session without a password set yet.
            return Session.createSessionFor(person, req);
        })
        .then(function(sessionId) {
            res.status(201).send({
                sessionId: sessionId
            });
        })
        .catch(db.Sequelize.UniqueConstraintError, function(validationErr) {
            // Send a 400 status with nice error message if the email address is already used
            if (_.find(validationErr.errors, 'path', 'email')) {
                res.status(400);
                throw new Error('There is already an account with this e-mail address.');
            }
            else {
                // If this wasn't about the email, simply throw the error again
                throw validationErr;
            }
        })
        .catch(next)
    ;
};

/**
 * Return the logged in user data
 * @param req
 * @param res
 * @param next
 */
exports.getMe = function(req, res, next) {
    // Calculate the task counts, then return
    req.user.calculateTaskCounts()
        .then(function() {
            return res.send(req.user);
        })
        .catch(next)
    ;
};

/**
 * Return the profile of a user with a certain id
 * @param req
 * @param res
 * @param next
 */
exports.getById = function(req, res, next) {
    var personId = req.params.id;
    var person;

    // Try to load the person wit the given
    db.Person
        .findById(personId, {
            attributes: ['id', 'nickname', 'accountType']
        })
        .then(function(existingPerson) {
            // Check if the given id points to an existing person
            if (!existingPerson) {
                res.status(404);
                throw new Error('Could not find any user with the given id.');
            }

            // All good, use the found person
            person = existingPerson;

            // Calculate the tasks this user did
            return person.calculateTaskCounts();
        })
        .then(function() {
            return res.send(person);
        })
        .catch(next)
    ;
};

/**
 * Update some of the properties of the logged in user
 * @param req
 * @param res
 * @param next
 */
exports.updateMe = function(req, res, next) {
    // Get the values that can be updated and set them on the user
    var personData = _.pick(req.body, 'email', 'fullName', 'password', 'nickname', 'locale');

    // If an empty password was provided, ignore it
    if (personData.password === '') {
        delete personData.password;
    }

    // Assign the data to the user
    _.assign(req.user, personData);

    // Save the user
    req.user.save()
        .then(function() {
            // Return the user
            return exports.getMe(req, res, next);
        })
        .catch(next)
    ;
};

/**
 * Checks whether the given reset token is valid
 * @param req
 * @param res
 * @param next
 */
exports.isValidToken = function(req, res, next) {
    var hash = cryptoUtils.hashResetToken(req.params.token);

    db.Person
        .findOne({
            where: {
                resetPasswordToken: hash,
                resetPasswordExpires: {$gt: Date.now()}
            }
        })
        .then(function(user) {
            if (!user) {
                res.status(400);
                throw new Error('Invalid token');
            }
            return res.status(200).send({});
        })
        .catch(next)
    ;
};

/**
 * Resets the password of the person if the correct reset token is given
 * @param req
 * @param res
 * @param next
 */
exports.resetPassword = function(req, res, next) {
    var personData = _.pick(req.body, 'token', 'password');
    var hash = cryptoUtils.hashResetToken(personData.token);

    db.Person
        .findOne({
            where: {
                resetPasswordToken: hash,
                resetPasswordExpires: {$gt: Date.now()}
            }
        })
        .then(function(user) {
            if (!user) {
                res.status(400);
                throw new Error('Invalid token!');
            }

            // Update the password and invalidate the reset token
            user.password = personData.password;
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            return user.save();
        })
        .then(function() {
            return res.status(200).send({});
        })
        .catch(next)
    ;
};
