'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        server = require('../../app');
    });

    it('can connect to server', function() {
        h.runAsync(function(done) {
            h.request.get(h.baseURL).end(function(res) {
                expect(res.statusCode).toBe(200);
                done();
            });
        });
    });

    h.afterAll(function () {
        server.close();
    });
});
