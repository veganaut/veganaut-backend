'use strict';
/* global it, expect */

var h = require('../helpers');

// TODO test person/me

h.describe('Person API methods', function() {
    it('can register new user', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'person')
                .send({
                    email: 'doge@mac.dog',
                    fullName: 'Doge MacDog',
                    nickName: 'Doger',
                    password: 'wow. such secure. so protect.'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    // Some sanity checks on the returned person
                    expect(res.body.email).toEqual('doge@mac.dog');
                    expect(res.body.fullName).toEqual('Doge MacDog');
                    expect(res.body.nickName).toEqual('Doger');
                    expect(res.body.role).toEqual('rookie', 'should set "rookie" role as default');

                    // Make sure password is not returned
                    expect(typeof res.body.password).toEqual('undefined');

                    done();
                })
            ;
        });
    });

    it('cannot set values that are not writable when registering', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'person')
                .send({
                    email: 'doge@do.ge',
                    fullName: 'Just Doge',
                    role: 'scout',
                    password: 'much safe. so security. wow.'
                })
                .end(function(res) {
                    expect(res.body.role).toEqual('rookie', 'should have rookie role even when providing another one');
                    // TODO: should check that team cannot be set, but it's random, so tricky to test
                    done();
                })
            ;
        });
    });

    it('can register as a full user from partial user (that already entered reference code)', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'person')
                .send({
                    id: '000000000000000000000003',
                    email: 'carol@carol.ca',
                    fullName: 'Carol Curie',
                    password: 'oh. yeah.'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    // Some sanity checks on the returned person
                    expect(res.body.id).toEqual('000000000000000000000003');
                    expect(res.body.email).toEqual('carol@carol.ca');
                    expect(res.body.fullName).toEqual('Carol Curie');

                    // make sure the team was not overwritten (TODO: make this test deterministic)
                    expect(res.body.team).toEqual('blue');

                    done();
                })
            ;
        });
    });

    it('cannot register with an already used e-mail address', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'person')
                .send({
                    email: 'foo@bar.baz',
                    fullName: 'Dudette That',
                    password: 'already has an account but forgot 2 months ago'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(400);
                    done();
                })
            ;
        });
    });

    it('cannot re-register already registered person', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'person')
                .send({
                    id: '000000000000000000000001',
                    email: 'a@b.ch',
                    fullName: 'Hacker DeHack',
                    password: 'ups'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(403);
                    done();
                })
            ;
        });
    });
});
