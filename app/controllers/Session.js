'use strict';
/**
 * Module dependencies.
 */

var hash = require('../lib/pass').hash;

/**
 * Temporary storage for sessions (map of session id to user object)
 * TODO: need to find a better way to store session (in mongo e.g.)
 * @type {{}}
 */
var sessionStore = {};

// dummy database
// TODO replace with persons
var users = {
    tj: { email: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash('foobar', function (err, salt, hash) {
    if (err) {
        throw err;
    }
    // store the salt & hash in the "db"
    users.tj.salt = salt;
    users.tj.hash = hash;
});

/**
 *
 * @param name
 * @param pass
 * @param fn
 * @returns {*}
 */
function authenticate(email, pass, fn) {
    // Authenticate using our plain-object database of doom!
    if (!module.parent) {
        console.log('authenticating %s:%s', email, pass);
    }
    var user = users[email];
    // query the db for the given username
    if (!user) {
        return fn(new Error('cannot find user'));
    }
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    hash(pass, user.salt, function (err, hash) {
        if (err) {
            return fn(err);
        }
        if (hash === user.hash) {
            var superUniqueId = 'not-really' + Math.random(); // TODO: make actually unique
            sessionStore[superUniqueId] = user;
            return fn(null, user, superUniqueId);
        }
        fn(new Error('invalid password'));
    });
}
exports.authenticate = authenticate;

/**
 * This we export to use on other calls
 * @param req
 * @param res
 * @param next
 */
function restrict(req, res, next) {
    var authHeader = req.get('Authorization');
    if (authHeader) {
        var parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'MonkeyBearer' && sessionStore[parts[1]]) {
            req.sessionId = parts[1];
            req.user = sessionStore[req.sessionId];
            return next();
        }
    }
    res.send(401,{ status: 'Error',
        message: 'Access denied!'
    });
}
exports.restrict = restrict;


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
                res.send({
                    sessionId: sessionId
                });
            }
            else {
                //TODO make sure this returns an error http status?
                res.send(401,{ status: '401 Unauthorized' });
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

