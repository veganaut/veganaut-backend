/**
 * Test helpers
 */
'use strict';
/* global runs, waitsFor, describe */

/** An express server */
exports.server = require('../app');
exports.port = 3001;
exports.baseURL = 'http://localhost:' + exports.port + '/';

// Export beforeAll and afterAll
require('jasmine-before-all');
/* global beforeAll, afterAll */
exports.beforeAll = beforeAll;
exports.afterAll = afterAll;

// SuperAgent
var request = require('superagent');

/** Wrapper around superagent's request, that adds authorization headers.
 *
 *  Params can be:
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)*/
exports.request = function(method, url) {
    // callback
    var callback;
    if ('function' === typeof url) {
        callback = url;
        url = method;
        method = 'GET';
    }

    // URL only
    if (1 === arguments.length) {
        url = method;
        method = 'GET';
    }

    // Here, the actual defaults are set
    var r = request(method, url)
        .set('Authorization', 'MonkeyBearer ' + exports.sessionId);

    if (callback) {
        return r.end(callback);
    } else {
        return r;
    }
};

// Fixtures
var fixtures = require('./fixtures/basic');
var setupFixtures = fixtures.setupFixtures;
exports.setupFixtures = fixtures.setupFixtures;

/** Runs the given command synchronously */
var runAsync = function(block) {
    var done = false;
    var complete = function() {
        done = true;
    };

    runs(function(){
        block(complete);
    });

    waitsFor(function(){
        return done;
    });
};
exports.runAsync = runAsync;

// Sessions
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var SessionController = require('../app/controllers/Session');

/**
 * Creates a session for the user with the given email address.
 */
var createSessionFor = function(email, next) {
    Person.findOne({email: email}, function(err, p) {
        if (err) { return next(err); }
        if (!p) { return next(new Error('Could not find person with email ' + email)); }
        var sessionId = SessionController.createSessionFor(p);
        next(null, sessionId);
    });
};
exports.createSessionFor = createSessionFor;

/**
 * describe is our wrapper around jasmine's describe. It runs a server, sets up fixtures, etc.
 * @param what The item that's being described
 * @param how  A function that contains the description
 */
exports.describe = function(what, how) {
    var wrapper = function() {
        // Start a server and initialize fixtures
        beforeAll(function () {
            runAsync(function(done) {
                mongoose.connect('mongodb://localhost/monkey', function(err) {
                    if (err) { console.log(err); }
                    exports.server.listen(exports.port, function(err) {
                        if (err) { console.log(err); }
                        setupFixtures(function(err) {
                            if (err) { console.log(err); }
                            createSessionFor('foo@bar.baz', function(err, sid) {
                                if (err) { console.log(err); }
                                exports.sessionId = sid;
                                done();
                            });
                        });
                    });
                });
            });
        });

        // Run the user-provided tests
        how();

        // Tear down the server
        afterAll(function() {
            runAsync(function(done) {
                exports.server.close(function(err) {
                    if (err) { console.log(err); }
                    mongoose.disconnect(function(err) {
                        if (err) { console.log(err); }
                        done();
                    });
                });
            });
        });
    };

    describe(what, wrapper);
};
