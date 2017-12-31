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

            var peopleTasks = stats.people.tasks;
            expect(typeof peopleTasks).toBe('object', 'got people.tasks stats');
            expect(peopleTasks.length).toBeGreaterThan(0, 'got some people task entries');
            _.each(peopleTasks, function(stat) {
                expect(typeof stat.person).toBe('object', 'people tasks contains person');
                expect(typeof stat.person.id).toBe('number', 'people tasks contains person with id');
                expect(typeof stat.person.nickname).toBe('string', 'people tasks contains person with nickname');
                expect(typeof stat.tasks).toBe('number', 'people tasks contains a number');
                expect(stat.tasks).toBeGreaterThan(0, 'people tasks contains a valid value');
            });

            expect(typeof stats.locationTypes).toBe('object', 'got locationTypes stats');
            var locationTypes = stats.locationTypes.locations;
            expect(typeof locationTypes).toBe('object', 'got locationTypes.locations stats');
            expect(locationTypes.length).toBe(2, 'got correct amount of locationTypes entries');
            _.each(locationTypes, function(stat) {
                expect(typeof stat.type).toBe('string', 'locationTypes contains a type');
                expect(typeof stat.locations).toBe('number', 'locationTypes contains a number');
                expect(stat.locations).toBe(2, 'has 2 locations of each type');
            });

            done();
        });
    });
});
