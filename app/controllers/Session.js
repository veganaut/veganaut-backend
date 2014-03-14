'use strict';
/**
 * Module dependencies.
 */

var uuid = require('uuid');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');

/**
 * Temporary storage for sessions (map of session id to user object)
 * TODO: need to find a better way to store session (in mongo e.g.)
 * @type {{}}
 */
var sessionStore = {};

exports.createSessionFor = function(user) {
    var superUniqueId = uuid.v4();
    sessionStore[superUniqueId] = user;
    return superUniqueId;
};

/**
 *
 * @param name
 * @param pass
 * @param next
 * @returns {*}
 */
var authenticate = function(email, pass, next) {
    console.log('authenticating %s', email);

    Person.findOne({email: email}, function(err, user) {
        if (err) { return next(err); }

        // query the db for the given username
        if (!user) {
            return next(new Error('Cannot find user with email ' + email + '.'));
        }
        user.verify(pass, function(err, result) {
            if (err) { return next(err); }
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
    var authHeader = req.get('Authorization');
    if (authHeader) {
        var parts = authHeader.split(' ');
        // We use "MonkeyBearer" identifier, it's almost oauth, but not quite
        // (or is it? I don't know, the docs are too long)
        if (parts.length === 2 && parts[0] === 'MonkeyBearer' && sessionStore[parts[1]]) {
            req.sessionId = parts[1];
            req.user = sessionStore[req.sessionId];
        }
    }
    next();
};

/**
 * Middleware that only allows logged in users through.
 * @param req
 * @param res
 * @param next
 */
exports.restrict = function(req, res, next) {
    if (typeof req.user === 'undefined') {
        return res.send(401,{ status: 'Error',
            message: 'Access denied!'
        });
    }
    next();
};

/**
 * POST /session
 * Login route
 * @param req
 * @param res
 */
exports.create = function (req, res) {
    // Email or password missing:
    if (!req.body.email || !req.body.password) {
        // no user or password given
        res.send(400,{ status: 'Bad Request',
            message: 'Email && Password are required'
        });
        return;
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
                return res.send(403, { error: err.message });
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

/**
 * Check if one is logged in
 * @param req
 * @param res
 */
exports.status = function (req, res) {
    // You are logged in!
    res.send({ status: 'OK' });
};

