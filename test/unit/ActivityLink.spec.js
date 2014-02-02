'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');
var mongoose = require('mongoose');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        h.runAsync(function(done) {
            server = require('../../app');
            server.listen(3001, done);
        });
    });

    it('can set a referral', function() {
        h.runAsync(function(done) {
            //TODO update request
            h.request.post(h.baseURL + 'activityLink/refer').end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

    it('can create a new activity task', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'activityLink/').end(function(res) {
                //TODO update request
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

    h.afterAll(function() {
        h.runAsync(function(done) {
            server.close(done);
        });
    });
});
