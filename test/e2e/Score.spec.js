'use strict';
/* global it, expect */

var h = require('../helpers_');

h.describe('Score controller', function() {
    it('returns score stats', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'score').end(function(res) {
                expect(res.statusCode).toBe(200);

                var stats = res.body;
                // TODO: expand these tests
                expect(typeof stats.teams).toBe('object', 'got teams stats');
                expect(typeof stats.people).toBe('object', 'got people stats');
                expect(typeof stats.teams.locations).toBe('object', 'got teams.locations stats');
                expect(typeof stats.teams.people).toBe('object', 'got teams.people stats');
                expect(typeof stats.people.missions).toBe('object', 'got people.missions stats');
                done();
            });
        });
    });
});
