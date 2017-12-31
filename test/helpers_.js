/**
 * Test helpers.
 *
 * Note that this is called helpers_ (with underscore) because jasmine treats
 * files called "helpers.js" specially.
 */
'use strict';

var _ = require('lodash');
var nock = require('nock');
var BPromise = require('bluebird');

var db = require('../app/models');

// Get the app
var port = 3001;
exports.baseURL = 'http://localhost:' + port + '/';

// Set up a mock mailer
var mockMailer = {
    sentMails: []
};
exports.mockMailer = mockMailer;

// Enable mockery (without complaining about all the modules we are going to load)
var mockery = require('mockery');
mockery.enable({
    warnOnUnregistered: false
});

// Register the mock mailer with mockery
// TODO: should use more absolute path?
mockery.registerMock('../utils/mailTransporter.js', {
    sendMail: function(mail) {
        mockMailer.sentMails.push(mail);
        return BPromise.resolve(undefined);
    }
});

// Configure Nock to allow connections to localhost (for the e2e tests to connect to the API).
nock.enableNetConnect('localhost:' + port);

// Create a mock response for the Nominatim API.
// This mock will keep on re-installing itself to allow for unlimited requests.
var nominatim = nock('https://nominatim.openstreetmap.org');
var installNominatimMock = function() {
    nominatim
        .get('/reverse')
        .query(true)
        .optionally()
        .reply(200, function() {
            // Re-install the mock to always be ready for a next request
            installNominatimMock();
            return {
                address: {
                    house_number: '1', // jshint ignore:line
                    road: 'Bundesplatz',
                    city: 'Bern',
                    postcode: '3005',
                    country: 'Switzerland',
                    country_code: 'ch' // jshint ignore:line
                }
            };
        })
    ;
};
installNominatimMock();

// SuperAgent
var request = require('superagent');

/**
 * Wrapper around superagent's request, that adds authorization headers.
 *
 * Params can be:
 *   request('GET', '/users').end(callback)
 *   request('/users').end(callback)
 *   request('/users', callback)
 */
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
        .set('Authorization', 'VeganautBearer ' + exports.sessionId);

    if (callback) {
        return r.end(callback);
    }
    else {
        return r;
    }
};

// Fixtures
var fixtures = require('./fixtures/basic');
exports.setupFixtures = fixtures.setupFixtures;

// Sessions
var SessionController = require('../app/controllers/Session');

/**
 * Creates a session for the user with the given email address.
 */
var createSessionFor = function(email) {
    // TODO: instead of creating sessions here, create them in the fixtures and then use them here
    return db.Person.findOne({where: {email: email}})
        .then(function(p) {
            if (!p) {
                throw new Error('Could not find person with email ' + email);
            }
            return SessionController.createSessionFor(p, undefined);
        });
};

// Get the app
var app = require('../app');

/**
 * describe is our wrapper around jasmine's describe. It runs a server, sets up fixtures, etc.
 * @param what     The item that's being described
 * @param options  An optional hash that can be used to choose the fixtures, the logged-in user, etc.
 * @param how      A function that contains the description
 */
exports.describe = function(what, options, how) {
    // TODO: should have a way for the caller to be able to access the fixtures (to retrieve ids and such)
    if (typeof(how) === 'undefined') {
        how = options;
        options = {};
    }
    _.defaults(options, {
        fixtures: 'basic',
        user: 'foo@bar.baz'
    });

    // Check if the fixtures is given as an object or a string
    var fixtures;
    if (typeof options.fixtures === 'string') {
        // If it's a string, try to load the fixture set of that name
        fixtures = require('./fixtures/' + options.fixtures);
    }
    else {
        // It's not a string: must be a FixtureCreator object
        fixtures = options.fixtures;
    }

    var wrapper = function() {
        // Start a server and initialize fixtures
        var server;
        beforeAll(function(done) {
            server = app.listen(port, function(err) {
                if (err) { console.log(err); }
                fixtures.setupFixtures()
                    .then(function() {
                        if (options.user) {
                            return createSessionFor(options.user);
                        }
                        else {
                            // Return empty sessionId
                            return undefined;
                        }
                    })
                    .then(function(sessionId) {
                        exports.sessionId = sessionId;
                        done();
                    })
                    .catch(console.log)
                ;
            });
        });

        // Run the user-provided tests
        how();

        // Tear down the server
        afterAll(function(done) {
            server.close(function(err) {
                if (err) { console.log(err); }
                done();
            });
        });
    };

    describe(what, wrapper);
};
