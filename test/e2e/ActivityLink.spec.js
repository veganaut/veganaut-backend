'use strict';
/* global  it, expect */

var h = require('../helpers');

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
                    done();
                })
            ;
        });
    });

    it('can use a reference for a baby when logged in', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'AK92oj',
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.referenceCode).toEqual('AK92oj');
                    expect(res.body.target).toBe('000000000000000000000005');
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

    it('cannot use reference code for different person', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'AK92oj'
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
