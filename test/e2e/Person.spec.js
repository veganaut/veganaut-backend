'use strict';

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
                    var person = res.body;
                    expect(person.email).toEqual('doge@mac.dog');
                    expect(person.fullName).toEqual('Doge MacDog');
                    expect(person.nickname).toEqual('Doger');
                    expect(person.locale).toEqual('de', 'has correct locale');

                    // Team is randomly assigned, but it should always be one of the 5 player teams
                    expect(person.team).toMatch(/^team[1-5]$/, 'has valid team');

                    // Make sure password is not returned
                    expect(typeof person.password).toEqual('undefined');

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
                    nickname: 'Doge',
                    password: 'much safe. so security. wow.',

                    // These values shouldn't be writable
                    team: 'anonymous',
                    attributes: {
                        pioneer: 100,
                        diplomat: 10,
                        evaluator: 20,
                        gourmet: 30
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    var person = res.body;
                    expect(person.team).toMatch(/^team[1-5]$/, 'team was not set to anonymous');
                    expect(person.attributes.pioneer).toEqual(0, 'could not set pioneer attribute');
                    expect(person.attributes.diplomat).toEqual(0, 'could not set diplomat attribute');
                    expect(person.attributes.evaluator).toEqual(0, 'could not set evaluator attribute');
                    expect(person.attributes.gourmet).toEqual(0, 'could not set gourmet attribute');
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
                    nickname: 'Dude',
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
                expect(me.nickname).toEqual('Alice');
                expect(me.fullName).toEqual('Alice Alison');
                expect(me.team).toEqual('team1');
                expect(me.type).toEqual('user');
                expect(me.locale).toEqual('en');
                expect(me.completedMissions).toBeGreaterThan(1, 'did a few missions');
                expect(typeof me.password).toEqual('undefined', 'password should not be returned');
                expect(typeof me.nickname).toEqual('string', 'should have a nickname');
                expect(typeof me.capture).toEqual('object', 'should have a capture object');
                expect(typeof me.capture.active).toEqual('boolean', 'should have a capture.active flag');

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
                    type: 'maybe'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    expect(res.body.type).toEqual('user', 'type has not changed');

                    done();
                })
            ;
        });
    });
});

h.describe('Person API methods for person/:id', function() {
    it('Person API methods for person/:id', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.email).toBeUndefined();
                expect(res.body.nickname).toBeDefined();
                expect(res.body.fullName).toBeUndefined();
                expect(res.body.locale).toBeUndefined();
                expect(res.body.team).toBeDefined();
                expect(res.body.completedMissions).toBeDefined();
                expect(typeof res.body.attributes).toEqual('object', 'attributes is a object');
                expect(res.body.attributes.pioneer).toBeDefined();
                expect(res.body.attributes.diplomat).toBeDefined();
                expect(res.body.attributes.evaluator).toBeDefined();
                expect(res.body.attributes.gourmet).toBeDefined();

                done();
            });
        });
    });
});
