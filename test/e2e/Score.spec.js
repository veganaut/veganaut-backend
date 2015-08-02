'use strict';

var _ = require('lodash');
var h = require('../helpers_');

h.describe('Score controller', function() {
    it('returns score stats', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'score').end(function(res) {
                expect(res.statusCode).toBe(200);

                var stats = res.body;
                expect(typeof stats.people).toBe('object', 'got people stats');

                var peopleMissions = stats.people.missions;
                expect(typeof peopleMissions).toBe('object', 'got people.missions stats');
                expect(peopleMissions.length).toBeGreaterThan(0, 'got some people mission entries');
                _.each(peopleMissions, function(stat) {
                    expect(typeof stat.person).toBe('object', 'people missions contains person');
                    expect(typeof stat.person.id).toBe('string', 'people missions contains person with id');
                    expect(typeof stat.person.nickname).toBe('string', 'people missions contains person with nickname');
                    expect(typeof stat.missions).toBe('number', 'people missions contains a number');
                    expect(stat.missions).toBeGreaterThan(0, 'people missions contains a valid value');
                });

                done();
            });
        });
    });
});
