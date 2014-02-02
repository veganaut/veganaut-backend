'use strict';
/* global describe, it, expect */

var h = require('../helpers');
var server;
var sessionId;

describe('Our API', function() {
    h.beforeAll(function () {
        h.runAsync(function(done) {
            server = require('../../app');
            server.listen(3001, function() {
                h.setupFixtures(function() {
                    h.createSessionFor('foo@bar.baz', function(err, sid) {
                        sessionId = sid;
                        done();
                    });
                });
            });
        });
    });

    it('can get a list of activity types', function() {
        h.runAsync(function(done) {
            // FIXME: add session id to request.
            h.request.get(h.baseURL + 'activity').end(function(res) {
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
