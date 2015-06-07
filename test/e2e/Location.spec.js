'use strict';

var _ = require('lodash');
var h = require('../helpers_');


h.describe('Location API methods as logged in user alice', function() {
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    description: 'Bagels',
                    link: 'http://example.com',
                    lat: 46,
                    lng: 7,
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    var location = res.body;
                    expect(location.name).toBe('Tingelkringel', 'set correct name');
                    expect(location.description).toBe('Bagels', 'set correct description');
                    expect(location.link).toBe('http://example.com', 'set correct link');
                    expect(location.lat).toBe(46, 'set correct lat');
                    expect(location.lng).toBe(7, 'set correct lng');
                    expect(location.type).toBe('gastronomy', 'set correct type');
                    expect(typeof location.id).toBe('string', 'has an id');
                    expect(typeof location.lastMissionDates).toMatch('object', 'lastMissionDates is an object');
                    expect(location.team).toBe('team1', 'team is team1');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(location.points.team1).toBeGreaterThan(0, 'has some team1 points');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(location.quality.average).toBe(0, 'quality is at 0 by default');
                    expect(location.quality.numRatings).toBe(0, 'quality numRatings is at 0 by default');

                    done();
                })
            ;
        });
    });

    it('can list locations', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/list')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(typeof res.body).toBe('object', 'returns an array of locations');
                    expect(res.body.length).toBe(5, '5 locations (4 from fixtures, one from previous test)');

                    _.each(res.body, function(location) {
                        expect(typeof location.name).toBe('string', 'has a name');
                        expect(typeof location.lat).toBe('number', 'has lat');
                        expect(typeof location.lng).toBe('number', 'has lng');
                        expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');
                        expect(typeof location.lastMissionDates).toBe('undefined', 'no lastMissionDates set');

                        expect(typeof location.updatedAt).toMatch('string', 'updatedAt is a string');
                        var updatedAt = new Date(location.updatedAt);
                        expect(isNaN(updatedAt.getTime())).toBe(false,
                            'updatedAt can be parsed as a valid date'
                        );

                        expect(location.team).toMatch(/^(team[1-5]|npc)$/, 'team is valid');
                        expect(typeof location.points).toBe('undefined', 'points are not set');
                        expect(typeof location.quality).toBe('object', 'has a quality');
                        expect(typeof location.quality.average).toBe('number', 'has a quality average');
                        expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    });
                    done();
                })
            ;
        });
    });

    it('can get an individual location with products', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/000000000000000000000006')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    var location = res.body;
                    expect(typeof location).toBe('object', 'response is an object');
                    expect(location.id).toBe('000000000000000000000006', 'correct location id');
                    expect(location.name).toBe('3dosha', 'correct name');
                    expect(typeof location.type).toBe('string', 'got a type');
                    expect(typeof location.lastMissionDates).toMatch('object', 'lastMissionDates is an object');
                    expect(Object.keys(location.lastMissionDates).length).toMatch(0, 'has no lastMissionDates set');
                    expect(typeof location.updatedAt).toMatch('string', 'updatedAt is a string');
                    var updatedAt = new Date(location.updatedAt);
                    expect(isNaN(updatedAt.getTime())).toBe(false,
                        'updatedAt can be parsed as a valid date'
                    );
                    expect(typeof location.team).toBe('string', 'team is a string');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(typeof location.points.team1).toBe('number', 'points.team1 is a number');
                    expect(typeof location.products).toBe('object', 'got an array of products');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    expect(location.products.length).toBeGreaterThan(0, 'got some products');

                    // Expected order: samosa should be before curry because curry is temporarilyUnavailable
                    var expectedOrder = ['samosa', 'curry'];
                    var expectedAvailabilities = ['available', 'temporarilyUnavailable'];
                    _.each(location.products, function(product, index) {
                        expect(typeof product.name).toBe('string', 'has a name');
                        expect(product.name).toBe(expectedOrder[index], 'correct name (meaning correct order)');
                        expect(typeof product.id).toBe('string', 'has an id');
                        expect(typeof product.location).toBe('undefined', 'location is not sent again');
                        expect(typeof product.availability).toBe('string', 'has an availability');
                        expect(product.availability).toBe(expectedAvailabilities[index], 'correct availability');
                    });

                    done();
                })
            ;
        });
    });

    it('can get an individual location with correct lastMissionDates', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/000000000000000000000007')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    var location = res.body;
                    expect(typeof location).toBe('object', 'response is an object');
                    expect(location.id).toBe('000000000000000000000007', 'correct location id');
                    expect(location.name).toBe('Reformhaus Ruprecht', 'correct name');
                    expect(typeof location.type).toBe('string', 'got a type');
                    expect(typeof location.lastMissionDates).toMatch('object', 'lastMissionDates is an object');
                    expect(Object.keys(location.lastMissionDates).length).toMatch(4, 'has  lastMissionDates set');
                    expect(typeof location.lastMissionDates.visitBonus).toMatch('string', 'got a last visitBonus date');
                    expect(typeof location.lastMissionDates.hasOptions).toMatch('string', 'got a last hasOptions date');

                    var visitBonus = new Date(location.lastMissionDates.visitBonus);
                    expect(isNaN(visitBonus.getTime())).toBe(false,
                        'nextVisitBonusDate can be parsed as a valid date'
                    );
                    var hasOptions = new Date(location.lastMissionDates.hasOptions);
                    expect(isNaN(hasOptions.getTime())).toBe(false,
                        'nextVisitBonusDate can be parsed as a valid date'
                    );

                    expect(typeof location.team).toBe('string', 'team is a string');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(typeof location.points.team1).toBe('number', 'points.team1 is a number');
                    expect(typeof location.products).toBe('object', 'got an array of products');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    expect(location.products.length).toBe(1, 'got products array');

                    done();
                })
            ;
        });
    });

    it('can get mission list of a location', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/000000000000000000000007/mission/list')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    var missions = res.body;

                    expect(typeof missions).toBe('object', 'response is an array (object)');
                    expect(missions.length).toBeGreaterThan(1, 'received more than one mission');

                    var updatedAt, previousUpdatedAt;
                    _.each(missions, function(mission) {
                        expect(typeof mission.id).toBe('string', 'id is a string');
                        expect(typeof mission.type).toBe('string', 'type is a string');
                        expect(typeof mission.location).toBe('string', 'location is a string');
                        expect(typeof mission.person).toBe('object', 'person is an object');
                        expect(typeof mission.person.id).toBe('string', 'person has an id');
                        expect(typeof mission.person.nickname).toBe('string', 'person has a nickname');
                        expect(mission.person.team).toMatch(/^team[1-5]$/, 'person has a valid team');
                        expect(Object.keys(mission.person).length).toBe(3, 'only 3 properties of the person are exposed');
                        expect(typeof mission.points).toBe('object', 'points is an object');
                        expect(typeof mission.completed).toMatch('undefined', 'does not expose when the mission was done');

                        // Should be ordered from newest to oldest
                        if (previousUpdatedAt) {
                            expect(previousUpdatedAt - updatedAt).toBeGreaterThan(-1, 'correct mission order');
                        }
                        previousUpdatedAt = updatedAt;

                    });

                    done();
                })
            ;
        });
    });

    it('can get available missions at a location', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/000000000000000000000007/availableMission/list')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    var available = res.body;
                    expect(typeof available).toBe('object', 'response is an object');
                    expect(typeof available.locationMissions).toBe('object', 'has locationMissions');
                    expect(Object.keys(available.locationMissions).length).toBe(8, 'has correct number of available location missions');

                    _.each(available.locationMissions, function(mission, missionType) {
                        expect(typeof mission).toBe('object', missionType + ' mission definition is an object');
                        expect(typeof mission.points).toBe('number', missionType + ' mission definition has valid points');
                    });

                    expect(typeof available.productMissions).toBe('object', 'has productMissions');
                    expect(Object.keys(available.productMissions).length).toBe(1, 'has correct number of products');

                    _.each(available.productMissions, function(missions, product) {
                        expect(typeof missions).toBe('object', product + ' product has a mission definition object');
                        expect(Object.keys(missions).length).toBe(2, product + ' has correct number of available product missions');

                        _.each(missions, function(mission, missionType) {
                            expect(typeof mission).toBe('object', missionType + ' mission definition is an object');
                            expect(typeof mission.points).toBe('number', missionType + ' mission definition has valid points');
                        });
                    });

                    // Specific checks with basic fixture data
                    var visitBonusMission = available.locationMissions.visitBonus;
                    expect(typeof visitBonusMission.lastCompleted).toBe('object', 'has a last completed visitBonus mission');
                    expect(visitBonusMission.points).toBeGreaterThan(0, 'visitBonus cool down period has expired');

                    var hasOptionsMission = available.locationMissions.hasOptions;
                    expect(typeof hasOptionsMission.lastCompleted).toBe('object', 'has a last completed hasOptions mission');
                    expect(hasOptionsMission.points).toBeGreaterThan(0, 'hasOptions cool down period has expired');

                    var whatOptionsMission = available.locationMissions.whatOptions;
                    expect(typeof whatOptionsMission.lastCompleted).toBe('object', 'has a last completed whatOptions mission');
                    expect(whatOptionsMission.points).toBeGreaterThan(0, 'whatOptions cool down period has expired');

                    var updateProductMission = available.productMissions['000000000000000000000103'].updateProduct;
                    expect(typeof updateProductMission.lastCompleted).toBe('object', 'has a last completed updateProduct mission');
                    expect(updateProductMission.points).toBe(0, 'updateProduct cool down period has NOT expired');

                    done();
                })
            ;
        });
    });

    it('returns 404 for location that does not exist', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/999999999999999999999999')
                .end(function(res) {
                    expect(res.statusCode).toBe(404);
                    expect(typeof res.body.error).toBe('string', 'got an error message');
                    done();
                })
            ;
        });
    });

    it('can update certain properties of an existing location', function() {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'location/000000000000000000000006')
                .send({
                    name: '3-Dosha',
                    description: 'Ayurvedic Cuisine',
                    link: 'http://example.ch',
                    type: 'retail',
                    lat: 47.3,
                    lng: 7.1
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    var location = res.body;
                    expect(typeof location).toBe('object', 'response is an object');
                    expect(location.id).toBe('000000000000000000000006', 'correct location id');
                    expect(location.name).toBe('3-Dosha', 'correct name');
                    expect(location.description).toBe('Ayurvedic Cuisine', 'correct description');
                    expect(location.link).toBe('http://example.ch', 'correct link');
                    expect(location.type).toBe('retail', 'correct new type');
                    expect(location.lat).toBe(47.3, 'correct new lat');
                    expect(location.lng).toBe(7.1, 'correct new lng');

                    // Check that it was really saved
                    h.request('GET', h.baseURL + 'location/000000000000000000000006')
                        .end(function(res) {
                            var location = res.body;
                            expect(location.name).toBe('3-Dosha', 'correct name');
                            expect(location.description).toBe('Ayurvedic Cuisine', 'correct description');
                            expect(location.link).toBe('http://example.ch', 'correct link');
                            expect(location.type).toBe('retail', 'correct new type');
                            expect(location.lat).toBe(47.3, 'correct new lat');
                            expect(location.lng).toBe(7.1, 'correct new lng');
                            done();
                        })
                    ;
                })
            ;
        });
    });
});


h.describe('Location update methods as logged in user alice', function() {
    it('does not update fields that are not sent', function() {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'location/000000000000000000000006')
                .send({
                    description: 'test'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    var location = res.body;
                    expect(typeof location).toBe('object', 'response is an object');
                    expect(location.id).toBe('000000000000000000000006', 'correct location id');
                    expect(location.name).toBe('3dosha', 'correct name');
                    expect(location.description).toBe('test', 'correct description');
                    expect(typeof location.link).toBe('undefined', 'correct link');
                    expect(location.type).toBe('gastronomy', 'correct type');
                    expect(location.lat).toBe(46.957113, 'correct lat');
                    expect(location.lng).toBe(7.452544, 'correct lng');

                    done();
                })
            ;
        });
    });
});


h.describe('Location API methods when not logged in', { user: '' }, function() {
    it('can list locations', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/list')
            .end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(typeof res.body).toBe('object', 'returns an array of locations');
                expect(res.body.length).toBe(4, 'has 4 locations');

                _.each(res.body, function(location) {
                    expect(typeof location.name).toBe('string', 'has a name');
                    expect(typeof location.lat).toBe('number', 'has lat');
                    expect(typeof location.lng).toBe('number', 'has lng');
                    expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');
                    expect(typeof location.lastMissionDates).toBe('undefined', 'no lastMissionDates set');
                    expect(location.team).toMatch(/^(team[1-5]|npc)$/, 'has a valid team');
                    expect(typeof location.points).toBe('undefined', 'points are not set');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                });
                done();
            })
        ;
        });
    });

    it('can get an individual location', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/000000000000000000000006')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    var location = res.body;
                    expect(typeof location).toBe('object', 'response is an object');
                    expect(location.id).toBe('000000000000000000000006', 'correct location id');
                    expect(location.name).toBe('3dosha', 'correct name');
                    expect(typeof location.type).toBe('string', 'got a type');
                    expect(typeof location.team).toBe('string', 'team is a string');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(typeof location.points.team1).toBe('number', 'points.team1 is a number');
                    expect(typeof location.lastMissionDates).toMatch('undefined', 'no lastMissionDates set');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    expect(typeof location.products).toBe('object', 'got an array of products');
                    expect(location.products.length).toBeGreaterThan(0, 'got some products');

                    _.each(location.products, function(product) {
                        expect(typeof product.name).toBe('string', 'has a name');
                        expect(typeof product.id).toBe('string', 'has an id');
                        expect(typeof product.rating).toBe('object', 'has a rating');
                        expect(typeof product.rating.average).toBe('number', 'has a rating average');
                        expect(typeof product.rating.numRatings).toBe('number', 'has a rating amount');
                        expect(typeof product.location).toBe('undefined', 'location is not sent again');
                        expect(typeof product.availability).toBe('string', 'has an availability');
                    });

                    done();
                })
            ;
        });
    });

    it('cannot update a location', function() {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'location/000000000000000000000006')
                .send({
                    name: 'test'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(401);
                    expect(typeof res.body.error).toBe('string');
                    done();
                })
            ;
        });
    });
});
