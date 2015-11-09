'use strict';
/**
 * Module dependencies.
 */

var generatePassword = require('password-generator');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');

/**
 * Temporary storage for sessions (map of session id to user id)
 * TODO: need to find a better way to store session (in mongo e.g.)
 * @type {{}}
 */
var sessionStore = {};

exports.createSessionFor = function(user) {
    var sessionId = generatePassword(40, false);
    sessionStore[sessionId] = user.id;
    return sessionId;
};

/**
 *
 * @param name
 * @param pass
 * @param next
 * @returns {*}
 */
var authenticate = function(email, pass, next) {
    // Query the db for the given email
    Person.findOne({email: email}, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new Error('Cannot find user with email ' + email + '.'));
        }
        user.verify(pass, function(err, result) {
            if (err) {
                return next(err);
            }
            if (result) {
                var superUniqueId = exports.createSessionFor(user);
                return next(null, user, superUniqueId);
            }
            else {
                return next(new Error('Incorrect password'));
            }
        });
    });
};

/**
 * Middleware for adding the user object to the request on req.user.
 * User auth is read from the auth header.
 * @param req
 * @param res
 * @param next
 */
exports.addUserToRequest = function(req, res, next) {
    var foundSession = false;
    var authHeader = req.get('Authorization');
    if (authHeader) {
        var parts = authHeader.split(' ');
        // We use "VeganautBearer" identifier, it's almost oauth, but not quite
        // (or is it? I don't know, the docs are too long)
        if (parts.length === 2 && parts[0] === 'VeganautBearer' && sessionStore[parts[1]]) {
            req.sessionId = parts[1];

            var userId = sessionStore[req.sessionId];
            foundSession = true;
            Person.findOne({_id: userId}, function(err, user) {
                if (err) {
                    return next(err);
                }
                req.user = user;
                return next();
            });
        }
    }
    if (!foundSession) {
        return next();
    }
};

/**
 * Middleware that only allows logged in users through.
 * @param req
 * @param res
 * @param next
 */
exports.restrict = function(req, res, next) {
    if (typeof req.user === 'undefined') {
        res.status(401);
        return next(new Error('Access denied.'));
    }
    next();
};

/**
 * POST /session
 * Login route
 * @param req
 * @param res
 * @param next
 */
exports.create = function (req, res, next) {
    // Check if email or password missing
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ status: 'Bad Request',
            message: 'Email && Password are required'
        });
    }
    // Otherwise try to login
    else {
        authenticate(req.body.email, req.body.password, function (err, user, sessionId) {
            if (user) {
                return res.send({
                    sessionId: sessionId
                });
            }
            else {
                // TODO: should probably not always send the error message to the user
                res.status(403);
                return next(err);
            }
        });
    }
};

/**
 * DELETE /session
 * Log out route
 * @param req
 * @param res
 */
exports.delete = function (req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    delete sessionStore[req.sessionId];
    res.send({ status: 'OK' });
};
