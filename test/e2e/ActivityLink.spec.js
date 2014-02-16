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
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.referenceCode).toEqual('OiWCrB');
                    expect(res.body.targets.length).toEqual(1);
                    done();
                })
            ;
        });
    });

    it('cannot use already used reference code', function() {
        h.runAsync(function(done) {
            //TODO update request
            h.request('POST', h.baseURL + 'activityLink/reference')
                .send({
                    referenceCode: 'Ff8tEQ'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(500);
                    expect(typeof res.body.error).toBe('string');
                    done();
                })
            ;
        });
    });

    it('can create a new activity link', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'activityLink/')
                .send({
                    targets: [{
                        fullName: 'Tester'
                    }],
                    location: 'Bern',
                    startDate: '01.02.2014',
                    activity: {
                        id: '52f7f8c01f56ed931aa694bd'
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    // TODO: write checks for the returned activtyLink
                    done();
                }
            );
        });
    });
});
