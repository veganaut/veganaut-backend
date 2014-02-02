'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        server = require('../../app');
    });

    it('can get a lits of activity types', function() {
        h.runAsync(function(done) {
            h.request.get(h.baseURL + 'activity').end(function(res) {
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
