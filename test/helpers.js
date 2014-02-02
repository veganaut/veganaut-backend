/**
 * Test helpers
 */

'use strict';

require('../app');  // Initialize models
var mongoose = require('mongoose');
var Person = mongoose.model('Person');

var SessionController = require('../app/controllers/Session');

require('jasmine-before-all');
exports.beforeAll = beforeAll;
exports.afterAll = afterAll;

var superagentDefaults = require('superagent-defaults');
exports.request = superagentDefaults();

var fixtures = require('./fixtures');
exports.setupFixtures = fixtures.setupFixtures;

// Set the port to 3001 for testing, so we can run this while having express
// running on its default port 3000
process.env.PORT = 3001;

exports.baseURL = 'http://localhost:' + process.env.PORT + '/';

exports.runAsync = function(block) {
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

exports.createSessionFor = function(email, next) {
    Person.findOne({email: email}, function(err, p) {
        if (err) { return next(err); }
        var sessionId = SessionController.createSessionFor(p);
        next(null, sessionId);
    });
};