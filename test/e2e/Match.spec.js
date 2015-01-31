'use strict';

var h = require('../helpers_');

// TODO: this whole call has to be thought about again (it's not used by the frontend at the moment)
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
                        score: 5,
                        users: 7,
                        babies: 0,
                        captured: 2
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
