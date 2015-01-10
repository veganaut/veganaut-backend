'use strict';
/* global it, expect */

var h = require('../helpers_');

// TODO test person/me

h.describe('Person API methods', function() {
    it('can register new user', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'person')
                .send({
                    email: 'doge@mac.dog',
                    fullName: 'Doge MacDog',
                    nickname: 'Doger',
                    locale: 'de',
                    password: 'wow. such secure. so protect.'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    // Some sanity checks on the returned person
                    expect(res.body.email).toEqual('doge@mac.dog');
                    expect(res.body.fullName).toEqual('Doge MacDog');
                    expect(res.body.nickname).toEqual('Doger');
                    expect(res.body.role).toEqual('rookie', 'should set "rookie" role as default');
                    expect(res.body.locale).toEqual('de', 'has correct locale');

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
                    expect(res.body.team).toEqual('team1');

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

h.describe('Person API methods for logged in user', function() {
    it('can get own profile information', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'person/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                var me = res.body;
                expect(me.id).toEqual('000000000000000000000001');
                expect(me.email).toEqual('foo@bar.baz');
                expect(me.fullName).toEqual('Alice Alison');
                expect(me.role).toEqual('veteran');
                expect(me.team).toEqual('team1');
                expect(me.type).toEqual('user');
                expect(me.locale).toEqual('en');
                expect(me.completedMissions).toBeGreaterThan(1, 'did a few missions');
                expect(typeof me.password).toEqual('undefined', 'password should not be returned');
                expect(typeof me.nickname).toEqual('string', 'should have a nickname');
                expect(typeof me.strength).toEqual('number', 'should have a strength');
                expect(typeof me.hits).toEqual('number', 'should have hits');
                expect(typeof me.isCaptured).toEqual('boolean', 'should have a isCaptured flag');

                done();
            });
        });
    });

    it('can update own profile information', function() {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'person/me')
                .send({
                    email: 'alice@bar.baz',
                    fullName: 'Alice Alisonja',
                    nickname: 'Al',
                    locale: 'de',
                    password: 'even better password'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    expect(res.body.id).toEqual('000000000000000000000001', 'user id should not change');
                    expect(res.body.email).toEqual('alice@bar.baz');
                    expect(res.body.fullName).toEqual('Alice Alisonja');
                    expect(res.body.nickname).toEqual('Al');
                    expect(res.body.locale).toEqual('de');
                    expect(typeof res.body.password).toEqual('undefined', 'password should not be returned');

                    done();
                })
            ;
        });
    });

    it('gets new profile info after profile update', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'person/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.email).toEqual('alice@bar.baz');
                expect(res.body.fullName).toEqual('Alice Alisonja');
                expect(res.body.nickname).toEqual('Al');
                expect(typeof res.body.password).toEqual('undefined', 'password should not be returned');

                done();
            });
        });
    });
});

h.describe('Person API methods for logged in user trying naughty things', function() {
    it('cannot update profile fields that are not writable', function() {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'person/me')
                .send({
                    role: 'scout',
                    type: 'maybe'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    expect(res.body.role).toEqual('veteran', 'role has not changed');
                    expect(res.body.type).toEqual('user', 'type has not changed');

                    done();
                })
            ;
        });
    });
});
