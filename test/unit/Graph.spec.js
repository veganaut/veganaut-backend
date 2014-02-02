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

    //TODO require auth?
    it('can get me', function() {
        h.runAsync(function(done) {
            h.request.get(h.baseURL + 'graph/me').end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

    it('can update the graph', function() {
        h.runAsync(function(done) {
            h.request.put(h.baseURL + 'graph').end(function(res) {
                //TODO define behavior here
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
