'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');
var mongoose = require('mongoose');

var server;

describe('Our API', function() {
    h.beforeAll(function () {
        h.runAsync(function(done) {
            server = require('../../app');
            server.listen(3001, function() {
                h.setupFixtures(done);
            });
        });
    });

    it('cannot access restricted areas when not logged in', function() {
        h.runAsync(function(done) {
            h.request.get(h.baseURL + 'session/status').end(function(res) {
                expect(res.statusCode).toBe(401);
                expect(res.body.status).toEqual('Error');
                done();
            });
        });
    });

    it('cannot login without email', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session').send({
                password: 'but no email'
            }).end(function(res) {
                    expect(res.statusCode).toBe(400);
                    done();
                });
        });
    });

    it('cannot login without password', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session').send({
                email: 'but no password'
            }).end(function(res) {
                    expect(res.statusCode).toBe(400);
                    done();
                });
        });
    });

    it('cannot login with nothing', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session').end(function(res) {
                    expect(res.statusCode).toBe(400);
                    done();
                });
        });
    });

    it('can let aliens login', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session').send({
                email: 'foo@bar.baz',
                password: 'foobar'
            }).end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.sessionId).toBeTruthy();
                done();
            });
            // TODO then call status and it should get an ok as well
        });
    });

    it('cannot let aliens login with wrong password', function() {
        h.runAsync(function(done) {
            h.request.post(h.baseURL + 'session').send({
                email: 'yann',
                password: 'hasthewrongpassword'
            }).end(function(res) {
                    expect(res.statusCode).toBe(403);
                    done();
                });
        });
    });

    // TODO test log out
    // TODO test log out when no session
    // TODO test login with wrong password

// FIXME: h.request does not have a delete method? how to do http delete?
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
