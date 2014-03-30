'use strict';
/* global it, expect */

var h = require('../helpers');

h.describe('The Match controller', {fixtures: 'extended'}, function() {
    it('can compute scores', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'match').end(function(res) {
                expect(res.statusCode).toBe(200);

                expect(res.body).toEqual({
                    blue: {
                        score: 6,
                        users: 5,
                        babies: 1,
                        captured: 0
                    },
                    green: {
                        score: 6,
                        users: 7,
                        babies: 0,
                        captured: 1
                    }
                });
                done();
            });
        });
    });
});
