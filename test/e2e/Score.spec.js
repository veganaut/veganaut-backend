'use strict';

var _ = require('lodash');
var h = require('../helpers_');

h.describe('Score controller', function() {
    it('returns score stats', function(done) {
        h.request('GET', h.baseURL + 'score').end(function(err, res) {
            expect(res.statusCode).toBe(200);

            var stats = res.body;
            expect(typeof stats.people).toBe('object', 'got people stats');
            expect(typeof stats.people.count).toBe('number', 'got total number of people');

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

            var peopleLocations = stats.people.locations;
            expect(typeof peopleLocations).toBe('object', 'got people.locations stats');
            expect(peopleLocations.length).toBeGreaterThan(0, 'got some people location entries');
            _.each(peopleLocations, function(stat) {
                expect(typeof stat.person).toBe('object', 'people location contains person');
                expect(typeof stat.person.id).toBe('string', 'people location contains person with id');
                expect(typeof stat.person.nickname).toBe('string', 'people location contains person with nickname');
                expect(typeof stat.locations).toBe('number', 'people location contains a number');
                expect(stat.locations).toBeGreaterThan(0, 'people location contains a valid value');
            });

            expect(typeof stats.locationTypes).toBe('object', 'got locationTypes stats');
            var locationTypes = stats.locationTypes.locations;
            expect(typeof locationTypes).toBe('object', 'got locationTypes.locations stats');
            expect(locationTypes.length).toBeGreaterThan(0, 'got some locationTypes entries');
            _.each(locationTypes, function(stat) {
                expect(typeof stat.type).toBe('string', 'locationTypes contains a type');
                expect(typeof stat.locations).toBe('number', 'locationTypes contains a number');
                expect(stat.locations).toBeGreaterThan(0, 'locationTypes contains a valid value');
            });

            done();
        });
    });
});
