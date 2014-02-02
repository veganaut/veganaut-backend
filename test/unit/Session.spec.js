'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        server = require('../../app');
    });

    //TODO require auth?
    it('can get a new session', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session').end(function(res) {
                //TODO define expected behavior
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

    it('can close an old session', function() {
        h.runAsync(function(done) {
            h.request.delete(h.baseURL + 'session').end(function(res) {
                //TODO define expected behavior
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
