'use strict';
/* global  it, expect */

var h = require('../helpers');

h.describe('Our API', function() {

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
            h.request('POST', h.baseURL + 'activityLink/').end(function(res) {
                //TODO update request
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });
});
