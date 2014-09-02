'use strict';
/* global it, expect */

var h = require('../helpers_');

h.describe('The Match controller', {fixtures: 'extended'}, function() {
    it('can compute scores', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'match').end(function(res) {
                expect(res.statusCode).toBe(200);

                expect(res.body).toEqual({
                    team1: {
                        score: 7,
                        users: 6,
                        babies: 1,
                        captured: 0
                    },
                    team2: {
                        score: 6,
                        users: 7,
                        babies: 0,
                        captured: 1
                    },
                    team3: {
                        score: 0,
                        users: 0,
                        babies: 0,
                        captured: 0
                    },
                    team4: {
                        score: 0,
                        users: 0,
                        babies: 0,
                        captured: 0
                    },
                    team5: {
                        score: 0,
                        users: 0,
                        babies: 0,
                        captured: 0
                    }
                });
                done();
            });
        });
    });
});
