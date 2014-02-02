'use strict';
/* global describe, it, expect */

var h = require('../helpers');
var server;

describe('Our API', function() {
    h.beforeAll(function () {
        h.runAsync(function(done) {
            server = require('../../app');
            server.listen(3001, done);
        });
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
        h.runAsync(function(done) {
            server.close(done);
        });
    });
});
