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

// FIXME: h.request does not have a delete method?
//    it('can close an old session', function() {
//        h.runAsync(function(done) {
//            h.request.delete(h.baseURL + 'session').end(function(res) {
//                //TODO define expected behavior
//                expect(res.statusCode).toBe(200);
//                expect(res.body.status).toEqual('OK');
//                done();
//            });
//        });
//    });

    h.afterAll(function() {
        h.runAsync(function(done) {
            server.close(done);
        });
    });
});
