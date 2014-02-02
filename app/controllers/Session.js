'use strict';
/**
 * Module dependencies.
 */

var hash = require('../lib/pass').hash;

// dummy database
// TODO replace with persons
var users = {
    tj: { email: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash('foobar', function(err, salt, hash){
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
    hash(pass, user.salt, function(err, hash){
        if (err) {
            return fn(err);
        }
        if (hash === user.hash) {
            return fn(null, user);
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
    if (req.session.user) {
        next();
    } else {
        res.send({ status: 'Error',
            message: 'Access denied!'
        });
    }
}
exports.restrict = restrict;


/**
 * POST /session
 * Login route
 * @param req
 * @param res
 */
exports.create = function(req, res){
    authenticate(req.body.email, req.body.password, function(err, user){
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(function(){
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.name +
                    ' click to <a href="/logout">logout</a>. ' +
                    ' You may now access <a href="/restricted">/restricted</a>.';
                res.send({ status: 'OK' });
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' +
                ' username and password.' +
                ' (use "tj" and "foobar")';
            //TODO make sure this returns an error http status?
            res.send({ status: 'Error' });
        }
    });
    //
};

/**
 * DELETE /session
 * Log out route
 * @param req
 * @param res
 */
exports.delete = function(req, res){
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function(){
        res.send({ status: 'OK' });
    });
};

/**
 * Check if one is logged in
 * @param req
 * @param res
 */
exports.status = function(req, res){
    // You are logged in!
    res.send({ status: 'OK' });
};

