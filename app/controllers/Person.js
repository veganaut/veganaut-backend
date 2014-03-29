/**
 * A controller for our people :)
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Person = mongoose.model('Person');

exports.register = function(req, res, next) {
    // TODO: This needs to work as follows:
    // - If the user already entered a reference code, (s)he has a session. In
    //   this case, we take the user from the session, and update it.
    // - If the user is new, we create a new user. The person model should
    //   automatically complain about duplicate emails and other invalidities
    //   in this case.


    // Pick the posted data
    var personData = _.pick(req.body, 'email', 'fullName', 'password', '_id');
    var person;

    var verifyEmailUnused = function(cb) {
        Person.findOne({email: personData.email}, function(err, existingPerson) {
            if (!err && existingPerson) {
                res.status(400);
                err = new Error('This e-mail address is already used.');
            }
            return cb(err);
        });
    };

    var getOrCreatePerson = function(cb) {
        if (typeof personData._id === 'string') {
            Person.findOne({_id: personData._id}, function(err, existingPerson) {
                if (err) {
                    return cb(err);
                }

                // Check if the person is already a full user
                if (existingPerson && typeof existingPerson.password !== 'undefined') {
                    res.status(403);
                    err = new Error('This user is already registered.');
                    return cb(err);
                }
                else {
                    // All good, use the found person
                    person = existingPerson;
                    return cb();
                }
            });
        }
        else {
            // No person id given, create completely new user
            person = new Person();
            return cb();
        }
    };

    var updatePerson = function(cb) {
        // TODO: find a better way of doing this (less verbose)
        person.email = personData.email;
        person.fullName = personData.fullName;
        person.password = personData.password;
        person.save(cb);
    };

    async.series([
        verifyEmailUnused,
        getOrCreatePerson,
        updatePerson
    ], function(err) {
        if (err) {
            // TODO: don't render error here, middleware should do that
            // TODO: also check for statusCode should be smarter. actually the Error object should contain the status code
            if (res.statusCode === 200) {
                res.status(500);
            }
            return res.send({error: err.message});
        }
        else {
            return res.send(201, _.pick(person, '_id', 'email', 'fullName', 'alienName'));
        }
    });
};
