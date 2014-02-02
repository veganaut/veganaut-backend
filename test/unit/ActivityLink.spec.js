'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        server = require('../../app');
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

    h.afterAll(function () {
        server.close();
    });
});
