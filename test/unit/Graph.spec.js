'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        server = require('../../app');
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

    h.afterAll(function () {
        server.close();
    });
});
