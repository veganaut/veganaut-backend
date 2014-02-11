'use strict';
/* global  it, expect */

var h = require('../helpers');

h.describe('ActivityLink API methods', function() {

    it('can set a referral', function() {
        h.runAsync(function(done) {
            //TODO update request
            h.request('POST', h.baseURL + 'activityLink/referer').end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

    it('can create a new activity task', function() {
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
