'use strict';
/* global it, expect */

var h = require('../helpers_');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var FixtureCreator = require('../fixtures/FixtureCreator').FixtureCreator;

h.describe('ActivityLink API methods', function() {
    it('can use a reference code', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'OiWCrB'
                })
                .set('Authorization', null)
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.referenceCode).toEqual('OiWCrB');
                    expect(res.body.target).toBe('000000000000000000000004');
                    Person.findById('000000000000000000000004', function (err, dave) {
                        expect(dave.team).toBe('team1');
                        done();
                    });
                })
            ;
        });
    });

    it('can use a reference for a baby when logged in', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'AK92oj'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.referenceCode).toEqual('AK92oj');
                    expect(res.body.target).toBe('000000000000000000000001');

                    // Alice doesn't get captured because Bob was captured by her team
                    Person.findById('000000000000000000000001', function (err, alice) {
                        expect(alice.capture.active).toBe(false, 'alice is not captured');

                        // Bob freed himself with this activity link
                        Person.findById('000000000000000000000002', function (err, bob) {
                            expect(bob.capture.active).toBe(false, 'bob is no longer captured');
                            done();
                        });
                    });
                })
            ;
        });
    });


    it('cannot use already used reference code', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'Ff8tEQ'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(409);
                    expect(typeof res.body.error).toBe('string');
                    done();
                })
            ;
        });
    });

    it('can create a activity link with dummy', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink')
                .send({
                    target: {
                        nickname: 'Tester'
                    },
                    activity: {
                        id: 'a00000000000000000000001'
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    // Make sure we get a referenceCode back and only that
                    expect(typeof res.body.referenceCode).toEqual('string');
                    expect(Object.keys(res.body)).toEqual(['referenceCode']);

                    Person.findOne({nickname: 'Tester'}, function (err, newPerson) {
                        expect(newPerson).not.toBeNull('should have created a new person');
                        expect(newPerson.nickname).toBe('Tester', 'set correct nickname');
                        done();
                    });
                }
            );
        });
    });

    it('can create a activity link with existing related person', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink')
                .send({
                    target: {
                        id: '000000000000000000000002'
                    },
                    activity: {
                        id: 'a00000000000000000000001'
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    done();
                }
            );
        });
    });

    it('cannot create activity link with person that one doesn\'t already have a link with', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink')
                .send({
                    target: {
                        id: '000000000000000000000005'
                    },
                    activity: {
                        id: 'a00000000000000000000001'
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(403);
                    expect(typeof res.body.error).toBe('string');
                    done();
                }
            );
        });
    });

    it('cannot create activity link with herself', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink')
                .send({
                    target: {
                        id: '000000000000000000000001'
                    },
                    activity: {
                        id: 'a00000000000000000000001'
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(403);
                    expect(typeof res.body.error).toBe('string');
                    done();
                }
            );
        });
    });

    it('can query the open activity links', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'activityLink/mine/open')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    expect(typeof res.body).toBe('object');
                    expect(res.body.length).toBeGreaterThan(0);

                    var openLink = res.body[0];
                    expect(openLink.target).toBeDefined();
                    expect(typeof openLink.target).toBe('string');
                    expect(typeof openLink.activity).toBe('string');
                    expect(typeof openLink.referenceCode).toBe('string');
                    done();
                }
            );
        });
    });
});


h.describe('ActivityLink API methods', {fixtures: 'extended'}, function() {
    it('cannot use reference code for different person', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'isaacDoesSomethingForLouie'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(409);
                    expect(typeof res.body.error).toBe('string');
                    done();
                })
            ;
        });
    });
});


var fix = new FixtureCreator();
fix
    .user('alice')
    .user('bob')
    .activityLink('alice', 'bob', true)
    .activityLink('bob', 'alice', false)
;
h.describe('ActivityLink between existing users', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('can use reference code between existing users', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'bobDoesSomethingForAlice'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    // Check if alice and bob still exists
                    // This is to make sure no nodes get deleted or merged away by mistake
                    Person.findOne({fullName: 'Alice Example'}, function (err, alice) {
                        expect(alice).not.toBeNull('alice still exists');

                        Person.findOne({fullName: 'Bob Example'}, function (err, bob) {
                            expect(typeof bob).not.toBeNull('bob still exists');
                            done();
                        });
                    });
                })
            ;
        });
    });
});

fix = new FixtureCreator()
    .user('alice', 'team1')
    .user('bob', 'team2')
    .activityLink('bob', 'alice', false)
;
h.describe('Capturing existing users', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('using a reference code captures the target of the activity link', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'bobDoesSomethingForAlice'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    Person.findOne({ email: 'alice@example.com' })
                        .populate('capture.person')
                        .exec(function (err, alice) {
                            expect(alice.capture.active).toBe(true, 'alice is now captured');
                            expect(alice.capture.person.email).toBe('bob@example.com', 'captured by bob');
                            expect(alice.capture.team).toBe('team2', 'captured by team2');
                            return done();
                        })
                    ;
                })
            ;
        });
    });
});

fix = new FixtureCreator()
    .user('alice', 'team1')
    .user('bob', 'team2')
    .user('carol', 'team1')
    .activityLink('bob', 'alice', true)  // Bob captured Alice (team2)
    .activityLink('carol', 'bob', true)  // Carol captured Bob (team1)
    .activityLink('alice', 'bob', false) // Alice wants to capture Bob (and therefore free both)
;
h.describe('Capturing existing users', {fixtures: fix, user: 'bob@example.com'}, function() {
    it('targeting a player of the team that one is currently captured by frees both players', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'aliceDoesSomethingForBob'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    Person.findOne({ email: 'alice@example.com' }, function (err, alice) {
                        expect(alice.capture.active).toBe(false, 'alice is no longer captured');

                        Person.findOne({ email: 'bob@example.com' }, function (err, bob) {
                            expect(bob.capture.active).toBe(false, 'bob is no longer captured');
                            done();
                        });
                    });
                })
            ;
        });
    });
});

fix = new FixtureCreator()
    .user('alice', 'team1')
    .user('bob', 'team2')
    .user('carol', 'team3')
    .activityLink('bob', 'alice', true)    // Bob captured Alice (team2)
    .activityLink('carol', 'alice', false) // Carol wants to capture Alice
;
h.describe('Capturing existing users', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('capturing an already captured player gets rid of the old capture', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'carolDoesSomethingForAlice'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    Person.findOne({ email: 'alice@example.com' })
                        .populate('capture.person')
                        .exec(function (err, alice) {
                            expect(alice.capture.active).toBe(true, 'alice is still captured');
                            expect(alice.capture.person.email).toBe('carol@example.com', 'captured by carol');
                            expect(alice.capture.team).toBe('team3', 'captured by team3');
                            done();
                        })
                    ;
                })
            ;
        });
    });
});

fix = new FixtureCreator()
    .user('alice', 'team1')
    .user('bob', 'team2')
    .user('carol', 'team3')
    .maybe('alicely')
    .activityLink('bob', 'alice', true)    // Bob captured Alice (team2)
    .activityLink('carol', 'alicely', false) // Carol wants to capture Alice (but doesn't have a direct reference to her yet)
;
h.describe('Capturing existing users', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('capturing an already captured player gets rid of the old capture (also if it goes through a maybe)', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'carolDoesSomethingForAlicely'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    Person.findOne({ email: 'alice@example.com' })
                        .populate('capture.person')
                        .exec(function (err, alice) {
                            expect(alice.capture.active).toBe(true, 'alice is still captured');
                            expect(alice.capture.person.email).toBe('carol@example.com', 'captured by carol');
                            expect(alice.capture.team).toBe('team3', 'captured by team3');
                            done();
                        })
                    ;
                })
            ;
        });
    });
});

// TODO: add spec that new player should get team of the link, not of the person adding him/her
