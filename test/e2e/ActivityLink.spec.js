'use strict';
/* global it, expect */

var h = require('../helpers');
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
                        expect(dave.team).toBe('blue');
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
                    done();
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
                        fullName: 'Tester'
                    },
                    location: 'Bern',
                    startDate: '01.02.2014',
                    activity: {
                        id: 'a00000000000000000000001'
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    // Make sure we get a referenceCode back and only that
                    expect(typeof res.body.referenceCode).toEqual('string');
                    expect(Object.keys(res.body)).toEqual(['referenceCode']);
                    done();
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
                    Person.findById('000000000000000000000001', function (err, alice) {
                        expect(alice).not.toBeNull('alice still exists');
                        Person.findById('000000000000000000000002', function (err, bob) {
                            expect(typeof bob).not.toBeNull('bob still exists');
                            done();
                        });
                    });
                })
            ;
        });
    });
});
