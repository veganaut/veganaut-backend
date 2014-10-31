/**
 * A controller for our people :)
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var constants = require('../utils/constants');
var Person = mongoose.model('Person');

exports.register = function(req, res, next) {
    // TODO: This needs to work as follows:
    // - If the user already entered a reference code, (s)he has a session. In
    //   this case, we take the user from the session, and update it.
    // - If the user is new, we create a new user. The person model should
    //   automatically complain about duplicate emails and other invalidities
    //   in this case.


    // Pick the posted data
    var personData = _.pick(req.body, 'email', 'fullName', 'password', 'nickname', 'id');
    var person;

    var getOrCreatePerson = function(cb) {
        if (typeof personData.id === 'string') {
            Person.findById(personData.id, function(err, existingPerson) {
                if (err) { return cb(err); }

                // Check if the given id points to an existing person
                if (!existingPerson) {
                    res.status(404);
                    err = new Error('Could not find any user with the given id.');
                    return cb(err);
                }

                // Check if the person is already a full user
                if (existingPerson.isUser()) {
                    res.status(403);
                    err = new Error('This user is already registered.');
                    return cb(err);
                }

                // All good, use the found person
                person = existingPerson;
                return cb();
            });
        } else {
            // No person id given, create completely new user
            person = new Person();
            return cb();
        }
    };

    var updatePerson = function(cb) {
        // Assign a random team
        if (typeof person.team === 'undefined') {
            person.team = _.sample(constants.TEAMS);
        }

        _.assign(person, personData);
        person.save(cb);
    };

    async.series([
        getOrCreatePerson,
        updatePerson,
        function (cb) {person.populateActivityLinks(cb);}
    ], function(err) {
        if (err) {
            // Send a 400 status if the email address is already used
            if (err.name === 'MongoError' && err.code === 11000) {
                res.status(400);
            }
            return next(err);
        }

        return res.status(201).send(person.toApiObject());
    });
};

exports.getMe = function (req, res, next) {
    req.user.populateActivityLinks(function (err) {
        if (err) {
            return next(err);
        }
        return res.status(200).send(req.user.toApiObject());
    });
};

exports.updateMe = function (req, res, next) {
    // Get the values that can be updated and set them on the user
    var personData = _.pick(req.body, 'email', 'fullName', 'password', 'nickname');
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
