'use strict';
/**
 * Module dependencies.
 */

var _ = require('lodash');
var BPromise = require('bluebird');
var generatePassword = require('password-generator');
var db = require('../models');


/**
 * Time in ms after an inactive session will be considered invalid.
 * Corresponds to 180 days.
 * @type {number}
 */
var SESSION_VALIDITY_PERIOD = 1000 * 60 * 60 * 24 * 180;

/**
 * Minimum time in ms between two updates of a session's activeAt date.
 * Corresponds to 8 hours.
 * @type {number}
 */
var SESSION_ACTIVE_PERIOD = 1000 * 60 * 60 * 8;

/**
 * Creates a session for the given user from the given request.
 * @param user User instance to create a session for
 * @param [req] The express request object (User-Agent will be retrieved)
 */
exports.createSessionFor = function(user, req) {
    // Generate a secure session id
    var sessionId = generatePassword(40, false);

    // Get the user agent if we can (this will later help the user to identify the session)
    var userAgent = 'unknown';
    if (_.isObject(req) && _.isFunction(req.get)) {
        userAgent = req.get('User-Agent');
    }

    // Create the session
    return db.Session.create({
            userId: user.id,
            sid: sessionId,
            userAgent: userAgent,
            activeAt: Date.now()
        })
        .then(function() {
            return sessionId;
        })
    ;
};

/**
 *
 * @param email
 * @param pass
 * @param req
 * @param next
 * @returns {*}
 */
var authenticate = function(email, pass, req, next) {
    var user;
    // Query the db for the given email
    db.Person.findOne({where: {email: email}})
        .then(function (person) {
            if (!person) {
                return next(new Error('Cannot find user with email ' + email + '.'));
            }
            user = person;
            return user.verify(pass);
        })
        .then(function(passwordVerifyResult) {
            if (passwordVerifyResult === true) {
                return exports.createSessionFor(user, req);
            }
            else {
                throw new Error('Incorrect password');
            }
        })
        .then(function(sessionId) {
            return next(null, user, sessionId);
        })
        .catch(next)
    ;
};

/**
 * Tries to extract the session id from the request. Returns undefined
 * if not session id was found.
 * @param req
 * @returns {string|undefined}
 */
var getSessionIdFromRequest = function(req) {
    var authHeader = req.get('Authorization');
    if (authHeader) {
        var parts = authHeader.split(' ');
        // We use "VeganautBearer" identifier, it's almost oauth, but not quite
        // (or is it? I don't know, the docs are too long)
        if (parts.length === 2 && parts[0] === 'VeganautBearer') {
            return parts[1];
        }
    }

    return undefined;
};

/**
 * Validates and updates the given session if necessary. A promise is returned
 * that either resolves to undefined (if the session is not valid) or the validated session.
 * Note that the returned session object should be used as it might have been updated.
 *
 * @param session
 * @param req
 * @returns {Promise}
 */
var validateAndUpdateSession = function(session, req) {
    if (!_.isObject(session)) {
        // No session given, return empty
        return BPromise.resolve(undefined);
    }


    // Calculate how long ago the session was last active
    var sessionActiveAgo = Date.now() - session.activeAt.getTime();

    // Check if the session is still valid
    if (sessionActiveAgo > SESSION_VALIDITY_PERIOD) {
        // No longer valid, delete it and return
        // TODO: The frontend will not always reload correctly when the app is already loaded and the session expires. This is very unlikely however.
        return session.destroy()
            .then(function() {
                // Resolve empty cause there is no valid session
                return BPromise.resolve(undefined);
            });
    }
    else {
        // Session is valid. Check if we need to update the activeAt date
        // We only do this ever so often to not have a db write on every request
        if (sessionActiveAgo > SESSION_ACTIVE_PERIOD) {
            // Set new date and userAgent
            session.activeAt = Date.now();
            session.userAgent = req.get('User-Agent');
            return session.save();
        }
        else {
            // Session is still set to active, return right away
            return BPromise.resolve(session);
        }
    }
};

/**
 * Middleware for adding the user object to the request on req.user.
 * User auth is read from the auth header.
 * @param req
 * @param res
 * @param next
 */
exports.addUserToRequest = function(req, res, next) {
    var sessionId = getSessionIdFromRequest(req);

    // If no session id was found, return without doing anything
    if (!_.isString(sessionId)) {
        return next();
    }

    // Find the session
    db.Session
        .findOne({
            where: {sid: sessionId},
            include: 'user'
        })
        .catch(function() {
            // Ignore errors when not finding a session, this will be treated
            // when validating the session
            return undefined;
        })
        .then(function(session) {
            return validateAndUpdateSession(session, req);
        })
        .then(function(session) {
            // Check if we got a validated session back
            if (_.isObject(session)) {
                // Session is valid, set the sid and user on the request
                req.sessionId = session.sid;
                req.user = session.user;
            }

            next();
        })
        .catch(next)
    ;
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
        authenticate(req.body.email, req.body.password, req, function (err, user, sessionId) {
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
 * @param next
 */
exports.delete = function(req, res, next) {
    // Destroy the user's session to log them out
    if (typeof req.sessionId === 'string' && req.sessionId.length > 0) {
        db.Session
            .destroy({where: {sid: req.sessionId}})
            .then(function() {
                res.send({status: 'OK'});
            })
            .catch(next)
        ;
    }
    else {
        return next(new Error('No session active.'));
    }
};
