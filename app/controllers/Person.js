/**
 * A controller for our people :)
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var constants = require('../utils/constants');
var Person = mongoose.model('Person');
var Mission = require('../models/Missions').Mission;
var cryptoUtils = require('../utils/cryptoUtils');

/**
 * Register a new user
 * @param req
 * @param res
 * @param next
 */
exports.register = function(req, res, next) {
    // Create person from the posted data
    var person = new Person(_.pick(req.body,
        'email', 'fullName', 'password', 'nickname', 'locale')
    );
    person.save(function(err) {
        if (err) {
            // Send a 400 status if the email address is already used
            if (err.name === 'MongoError' && err.code === 11000) {
                res.status(400);
            }
            return next(err);
        }

        return res.status(201).send(person);
    });
};

/**
 * Return the logged in user data
 * @param req
 * @param res
 */
exports.getMe = function(req, res) {
    // Count number of missions of this player
    Mission.count({person: req.user})
        .exec(function(err, numMissions) {
            var resObj = req.user.toJSON();
            resObj.completedMissions = numMissions;
            return res.status(200).send(resObj);
        })
    ;
};

/**
 * Return the profile of a user with a certain id
 * @param req
 * @param res
 * @param next
 */
exports.getById = function(req, res, next) {
    // Count number of missions of this player
    var personId = req.params.id;
    var person;
    var completedMissions;

    var getPerson = function(cb) {
        Person.findById(personId, function(err, existingPerson) {
            if (err) {
                return cb(err);
            }

            // Check if the given id points to an existing person that is a player
            if (!existingPerson || existingPerson.accountType === constants.ACCOUNT_TYPES.PLAYER) {
                res.status(404);
                err = new Error('Could not find any user with the given id.');
                return cb(err);
            }

            // All good, use the found person
            person = existingPerson;
            return cb();
        });
    };

    var getMissionCount = function(cb) {
        Mission.count({person: personId})
            .exec(function(err, numMissions) {
                completedMissions = numMissions;
                return cb();
            });
    };
    async.series([
        getPerson,
        getMissionCount
    ], function(err) {
        if (err) {
            return next(err);
        }
        var resObj = _.pick(person,
            'id', 'nickname', 'attributes'
        );
        resObj.completedMissions = completedMissions;
        return res.status(200).send(resObj);
    });

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
    _.assign(req.user, personData);

    // Save the user
    req.user.save(function(err) {
        if (err) {
            return next(err);
        }

        // Return the user
        return exports.getMe(req, res, next);
    });
};

/**
 * Checks whether the given reset token is valid
 * @param req
 * @param res
 * @param next
 */
exports.isValidToken = function(req, res, next) {
    var hash = cryptoUtils.hashResetToken(req.params.token);

    Person.findOne({
        resetPasswordToken: hash,
        resetPasswordExpires: {$gt: Date.now()}
    }, function(err, user) {
        if (!user) {
            res.status(400);
            return next(new Error('Invalid token'));
        }
        return res.status(200).send({});
    });
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

    Person.findOne({
        resetPasswordToken: hash,
        resetPasswordExpires: {$gt: Date.now()}
    }, function(err, user) {
        if (!user) {
            res.status(400);
            return next(new Error('Invalid token!'));
        }

        // Update the password and invalidate the reset token
        user.password = personData.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save(function() {
            return res.status(200).send({});
        });
    });
};
