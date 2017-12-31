'use strict';

var h = require('../helpers_');
var FixtureCreator = require('../fixtures/FixtureCreator');

var fix = new FixtureCreator();
fix.user('craig');

h.describe('Add location flow 1.', {fixtures: fix, user: 'craig@example.com'}, function() {
    var addedLocationId;

    it('add a new location', function(done) {
        h.request('POST', h.baseURL + 'location')
            .send({
                name: 'Falafel Place',
                lat: 46.943,
                lng: 7.443,
                type: 'gastronomy'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var location = res.body;
                addedLocationId = location.id;
                expect(location.name).toBe('Falafel Place', 'set correct name');
                expect(location.lat).toBe(46.943, 'set correct lat');
                expect(location.lng).toBe(7.443, 'set correct lng');
                expect(location.type).toBe('gastronomy', 'set correct type');
                expect(typeof location.id).toBe('number', 'has an id');
                expect(typeof location.quality).toBe('object', 'has a quality');
                expect(location.quality.average).toBe(0, 'quality is at 0 by default');
                expect(location.quality.numRatings).toBe(0, 'quality numRatings is at 0 by default');

                // Check that it got the address from the Nominatim mock
                expect(typeof location.address).toBe('object', 'got address object');
                expect(location.address.street).toBe('Bundesplatz', 'got street');
                expect(location.address.house).toBe('1', 'got house');
                expect(location.address.postcode).toBe('3005', 'got postcode');
                expect(location.address.city).toBe('Bern', 'got city');
                expect(location.address.country).toBe('Switzerland', 'got country');
                expect(Object.keys(location.address).length).toBe(5, 'got correct amount of address details');

                done();
            })
        ;
    });

    it('updated user stats with new completed task and added location', function(done) {
        h.request('GET', h.baseURL + 'person/me')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var craig = res.body;

                expect(craig.completedTasks).toBe(1, 'now has a completed task from adding the location');
                expect(craig.addedLocations).toBe(1, 'now has an added location');

                done();
            })
        ;
    });

    it('does not suggest one of the tasks that were automatically triggered when adding the location', function(done) {
        h.request('GET', h.baseURL + 'location/' + addedLocationId + '/suggestedTask')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var suggested = res.body;

                expect(suggested).not.toContain('SetLocationName', 'wrong suggestion 1');
                expect(suggested).not.toContain('SetLocationType', 'wrong suggestion 2');
                expect(suggested).not.toContain('SetLocationCoordinates', 'wrong suggestion 3');

                // These tasks require the user to have been at the place, so they shouldn't be suggested yet
                expect(suggested).not.toContain('SetLocationExistence', 'wrong suggestion 4');
                expect(suggested).not.toContain('SetLocationProductListComplete', 'wrong suggestion 5');
                expect(suggested).not.toContain('TagLocation', 'wrong suggestion 6');
                expect(suggested).not.toContain('RateLocationQuality', 'wrong suggestion 7');

                done();
            })
        ;
    });

    it('can submit the HowWellDoYouKnowThisLocation task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: addedLocationId,
                type: 'HowWellDoYouKnowThisLocation',
                outcome: {
                    knowLocation: 'regular'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.outcome.knowLocation).toBe('regular', 'correct outcome');
                done();
            })
        ;
    });

    it('updated user stats with new completed task', function(done) {
        h.request('GET', h.baseURL + 'person/me')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var craig = res.body;

                expect(craig.completedTasks).toBe(2, 'now has 2 completed task');
                expect(craig.addedLocations).toBe(1, 'still only 1 added location');

                done();
            })
        ;
    });

    it('suggested missions after submitting HowWellDoYouKnowThisLocation task', function(done) {
        h.request('GET', h.baseURL + 'location/' + addedLocationId + '/suggestedTask')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var suggested = res.body;

                expect(suggested).not.toContain('HowWellDoYouKnowThisLocation', 'does not suggest same mission again');
                expect(suggested).not.toContain('SetLocationExistence', 'existence not suggested (was triggered automatically)');

                done();
            })
        ;
    });

});
