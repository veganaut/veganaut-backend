'use strict';
/* global it, expect */

var h = require('../helpers');

h.describe('Our API', function() {

    it('can get a list of activity types', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'activity').end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

});
