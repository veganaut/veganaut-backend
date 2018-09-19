'use strict';

var h = require('../helpers_');

h.describe('Person API methods when not logged in', {user: ''}, function() {
    it('can register new user', function(done) {
        h.request('POST', h.baseURL + 'person')
            .send({
                email: 'doge@mac.dog',
                nickname: 'Doger',
                locale: 'de'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);

                // Should have gotten a session in return
                var session = res.body;
                expect(typeof session.sessionId).toEqual('string', 'got a session id');

                // Use the session received from the registration
                h.sessionId = res.body.sessionId;
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    h.sessionId = undefined; // Unset session again
                    expect(res.statusCode).toBe(200, 'could get profile with session from registration');

                    var person = res.body;
                    expect(person.email).toEqual('doge@mac.dog');
                    expect(person.nickname).toEqual('Doger');
                    expect(person.locale).toEqual('de', 'has correct locale');
                    expect(person.accountType).toBe('player', 'has correct account type');
                    done();
                });
            })
        ;
    });

    it('cannot set values that are not writable when registering', function(done) {
        h.request('POST', h.baseURL + 'person')
            .send({
                email: 'doge@do.ge',
                nickname: 'Doge',

                // These values shouldn't be writable
                fullName: 'Just Doge',
                accountType: 'npc'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);

                // Use the session received from the registration
                h.sessionId = res.body.sessionId;
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    h.sessionId = undefined; // Unset session again

                    var person = res.body;
                    expect(typeof person.fullName).toEqual('undefined', 'fullName was not set');
                    expect(person.accountType).toEqual('player', 'accountType was not set to npc');
                    done();
                });
            })
        ;
    });

    it('cannot register with an already used e-mail address', function(done) {
        h.request('POST', h.baseURL + 'person')
            .send({
                email: 'foo@bar.baz',
                nickname: 'Dude'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(400);
                expect(typeof res.body.error).toBe('string', 'has an error message');
                expect(typeof res.body.sessionId).toBe('undefined', 'did not get a session id');
                done();
            })
        ;
    });

    it('cannot get person by id', function(done) {
        h.request('GET', h.baseURL + 'person/1').end(function(err, res) {
            expect(res.statusCode).toBe(401);
            done();
        });
    });
});

h.describe('Person API methods for logged in user', function() {
    it('can get own profile information', function(done) {
        h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
            expect(res.statusCode).toBe(200);

            var me = res.body;
            expect(me.id).toEqual(1);
            expect(me.email).toEqual('foo@bar.baz');
            expect(me.nickname).toEqual('Alice');
            expect(me.fullName).toEqual('Alice Alison');
            expect(me.locale).toEqual('en');
            expect(me.accountType).toEqual('player');
            expect(me.completedTasks).toBeGreaterThan(1, 'did a few tasks');
            expect(me.addedLocations).toBeGreaterThan(0, 'added a location');
            expect(typeof me.password).toEqual('undefined', 'password should not be returned');
            expect(Object.keys(me).length).toBe(8, 'correct amount of properties');

            done();
        });
    });

    it('can update own profile information', function(done) {
        h.request('PUT', h.baseURL + 'person/me')
            .send({
                email: 'alice@bar.baz',
                fullName: 'Alice Alisonja',
                nickname: 'Ali',
                locale: 'de',
                password: 'even better password'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.id).toEqual(1, 'user id should not change');
                expect(res.body.email).toEqual('alice@bar.baz');
                expect(res.body.fullName).toEqual('Alice Alisonja');
                expect(res.body.nickname).toEqual('Ali');
                expect(res.body.locale).toEqual('de');
                expect(typeof res.body.password).toEqual('undefined', 'password should not be returned');

                // Note: password is checked in the next test

                done();
            })
        ;
    });

    it('does not fail when providing empty password in an update', function(done) {
        h.request('PUT', h.baseURL + 'person/me')
            .send({
                nickname: 'Al',
                password: ''
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.nickname).toEqual('Al');
                expect(typeof res.body.password).toEqual('undefined', 'password should not be returned');

                // Check that the password was not changed
                h.request('POST', h.baseURL + 'session')
                    .send({
                        email: 'alice@bar.baz',
                        password: 'even better password'
                    })
                    .end(function(err, res) {
                        expect(res.statusCode).toBe(200, 'old password is still set');
                        done();
                    })
                ;
            })
        ;
    });

    it('gets new profile info after profile update', function(done) {
        h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
            expect(res.statusCode).toBe(200);

            expect(res.body.email).toEqual('alice@bar.baz');
            expect(res.body.fullName).toEqual('Alice Alisonja');
            expect(res.body.nickname).toEqual('Al');
            expect(typeof res.body.password).toEqual('undefined', 'password should not be returned');

            done();
        });
    });

    it('can get person by id', function(done) {
        h.request('GET', h.baseURL + 'person/1').end(function(err, res) {
            expect(res.statusCode).toBe(200);

            var person = res.body;
            expect(typeof person.id).toBe('number', 'id');
            expect(person.email).toBeUndefined();
            expect(person.nickname).toBeDefined();
            expect(person.fullName).toBeUndefined();
            expect(person.locale).toBeUndefined();
            expect(person.password).toBeUndefined();
            expect(person.accountType).toBe('player', 'accounType');
            expect(typeof person.completedTasks).toBe('number', 'completedTasks');
            expect(typeof person.addedLocations).toBe('number', 'addedLocations');
            expect(Object.keys(person).length).toBe(5, 'correct amount of properties');

            done();
        });
    });
});

h.describe('Person API methods for logged in user trying naughty things', function() {
    it('cannot update profile fields that are not writable', function(done) {
        h.request('PUT', h.baseURL + 'person/me')
            .send({
                completedTasks: 100,
                addedLocations: 50,
                accountType: 'npc',
                resetPasswordToken: '',
                resetPasswordExpires: ''
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.completedTasks).not.toEqual(100, 'completedTasks has not changed');
                expect(res.body.addedLocations).not.toEqual(50, 'addedLocations has not changed');
                expect(res.body.accountType).toBe('player', 'accountType did not change');

                // Can't really test this here as those values are not exposed
                expect(res.body.resetPasswordToken).toBeUndefined();
                expect(res.body.resetPasswordExpires).toBeUndefined();

                done();
            })
        ;
    });
});
