'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */
require('jasmine-before-all');
var superagentDefaults = require('superagent-defaults');

var request = superagentDefaults();

process.env.PORT = 3001;
var baseURL = 'http://localhost:' + process.env.PORT + '/';
var server;

// Shamelessly copied from https://github.com/derickbailey/jasmine.async
function runAsync(block) {
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
}

describe('API', function() {
    beforeAll(function () {
        server = require('../../app');
    });

    it('can connect to server', function() {
        runAsync(function(done) {
            request.get(baseURL).end(function(res) {
                expect(res.statusCode).toBe(200);
                done();
            });
        });
    });

    afterAll(function () {
        server.close();
    });
});
