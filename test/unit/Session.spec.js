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

    it('cannot access restricted areas when not logged in', function() {
        h.runAsync(function(done) {
            h.request.get(h.baseURL + 'session/status').end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('Error');
                done();
            });
        });
    });

    it('can let aliens login', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session',{
                email: 'tj',
                password: 'foobar'
            }).end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

    // TODO log out when no session
    // TODO login
    // TODO login with wrong password

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
