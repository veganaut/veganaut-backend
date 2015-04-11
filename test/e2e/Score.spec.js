'use strict';

var _ = require('lodash');
var h = require('../helpers_');

h.describe('Score controller', function() {
    it('returns score stats', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'score').end(function(res) {
                expect(res.statusCode).toBe(200);

                var stats = res.body;
                expect(typeof stats.teams).toBe('object', 'got teams stats');
                expect(typeof stats.people).toBe('object', 'got people stats');

                var teamLocations = stats.teams.locations;
                expect(typeof teamLocations).toBe('object', 'got teams.locations stats');
                expect(teamLocations.length).toBe(5, 'got one team location entry for every team');
                _.each(teamLocations, function(stat) {
                    expect(stat.team).toMatch(/team[0-9]/, 'team location contains a valid team');
                    expect(typeof stat.locations).toBe('number', 'team location contains a number');
                    expect(stat.locations).toBeGreaterThan(-1, 'team location contains a valid value');
                });

                var teamPeople = stats.teams.people;
                expect(typeof teamPeople).toBe('object', 'got teams.people stats');
                expect(teamPeople.length).toBe(5, 'got one team people entry for every team');
                _.each(teamPeople, function(stat) {
                    expect(stat.team).toMatch(/^team[1-5]$/, 'team people contains a valid team');
                    expect(typeof stat.people).toBe('number', 'team people contains a number');
                    expect(stat.people).toBeGreaterThan(-1, 'team people contains a valid value');
                });

                var peopleMissions = stats.people.missions;
                expect(typeof peopleMissions).toBe('object', 'got people.missions stats');
                expect(peopleMissions.length).toBeGreaterThan(0, 'got some people mission entries');
                _.each(peopleMissions, function(stat) {
                    expect(typeof stat.person).toBe('object', 'people missions contains person');
                    expect(typeof stat.person.id).toBe('string', 'people missions contains person with id');
                    expect(typeof stat.person.nickname).toBe('string', 'people missions contains person with nickname');
                    expect(stat.person.team).toMatch(/^team[1-5]$/, 'people missions contains person with valid team');
                    expect(typeof stat.missions).toBe('number', 'people missions contains a number');
                    expect(stat.missions).toBeGreaterThan(0, 'people missions contains a valid value');
                });

                done();
            });
        });
    });
});
