'use strict';

var _ = require('lodash');
var h = require('../helpers_');
var FixtureCreator = require('../fixtures/FixtureCreator');

var fix = new FixtureCreator();
fix
    .user('alice')
    .location('alice', 'Tingelkringel')
;

var locationId = fix.getFixtures()['Tingelkringel'].id;

h.describe('Basic functionality of Missions API methods.', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('can submit a mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'hasOptions',
                    outcome: 'yes',
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    var mission = res.body;
                    expect(typeof mission.id).toBe('string', 'id is a string');
                    expect(typeof mission.person).toBe('string', 'person is a string');
                    expect(typeof mission.location).toBe('string', 'location is a string');
                    expect(typeof mission.completed).toBe('string', 'completed is a string');
                    expect(typeof mission.points).toBe('number', 'points is a number');
                    expect(mission.type).toBe('hasOptions', 'type is hasOptions');
                    expect(mission.causedOwnerChange).toBe(false, 'did not cause an owner change');
                    expect(mission.outcome).toBe('yes', 'outcome of the mission');
                    done();
                })
            ;
        });
    });

    it('can submit visitBonus mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'visitBonus',
                    outcome: true,
                    points: 50
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('visitBonus', 'type of mission');
                    expect(res.body.points).toEqual(50, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit hasOptions mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'hasOptions',
                    outcome: 'yes',
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('hasOptions', 'type of mission');
                    expect(res.body.points).toEqual(10, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit wantVegan mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'wantVegan',
                    outcome: [
                        { expression: 'vegan', expressionType: 'builtin' },
                        { expression: 'noMeat', expressionType: 'builtin' },
                        { expression: 'ganz vegetarisch', expressionType: 'custom' }
                    ],
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('wantVegan', 'type of mission');
                    expect(res.body.points).toEqual(10, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit whatOptions mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'whatOptions',
                    outcome: [
                        {
                            product: {
                                name: 'Curry'
                            }
                        },
                        {
                            product: {
                                name: 'Smoothie'
                            }
                        }
                    ],
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('whatOptions', 'type of mission');
                    expect(res.body.points).toEqual(10, 'points of mission');
                    _.each(res.body.outcome, function(o) {
                        expect(typeof o.product).toBe('string', 'product (id) is an string');
                    });
                    done();
                })
            ;
        });
    });

    it('can submit giveFeedback mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'giveFeedback',
                    outcome: 'Moar sauce',
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('giveFeedback', 'type of mission');
                    expect(res.body.points).toEqual(10, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit offerQuality mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'offerQuality',
                    outcome: 4,
                    points: 20
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('offerQuality', 'type of mission');
                    expect(res.body.points).toEqual(20, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit effortValue mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'effortValue',
                    outcome: 'no',
                    points: 20
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('effortValue', 'type of mission');
                    expect(res.body.points).toEqual(20, 'points of mission');
                    done();
                })
            ;
        });
    });

    // Test validation with a few invalid submissions
    it('cannot submit bogus visitBonus mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'visitBonus',
                    // missing outcome
                    points: 100
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(500);
                    done();
                })
            ;
        });
    });

    it('cannot submit bogus wantVegan mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'wantVegan',
                    outcome: { bogusValue: 'this is not an array' },
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(500);
                    done();
                })
            ;
        });
    });

    it('cannot submit bogus wantVegan mission: validate inner outcome object', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'wantVegan',
                    outcome: [
                        { expression: 'bogus', expressionType: 'bogusValue' }
                    ],
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(500);
                    done();
                })
            ;
        });
    });

    it('cannot submit a bogus offerQuality mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'offerQuality',
                    outcome: 100,  // That's way too large for a 1-5 rating
                    points: 10
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(500);
                    done();
                })
            ;
        });
    });


});

h.describe('Product missions referring to existing products.', function() {
    it('can submit rateProduct mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'rateProduct',
                    outcome: {
                        product: '000000000000000000000101',
                        info: 1
                    },
                    points: 5
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('rateProduct', 'type of mission');
                    expect(res.body.points).toEqual(5, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit buyOptions mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'buyOptions',
                    outcome: [
                        {
                            product: '000000000000000000000101'
                        },
                        {
                            product: '000000000000000000000102'
                        }
                    ],
                    points: 20
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('buyOptions', 'type of mission');
                    expect(res.body.points).toEqual(20, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit setProductName mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'setProductName',
                    outcome: {
                        product: '000000000000000000000101',
                        info: 'Indian Curry'
                    },
                    points: 0
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('setProductName', 'type of mission');
                    expect(res.body.points).toEqual(0, 'points of mission');
                    done();
                })
            ;
        });
    });

    it('can submit setProductAvail mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'setProductAvail',
                    outcome: {
                        product: '000000000000000000000101',
                        info: 'temporarilyUnavailable'
                    },
                    points: 5
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('setProductAvail', 'type of mission');
                    expect(res.body.points).toEqual(5, 'points of mission');
                    done();
                })
            ;
        });
    });
});

h.describe('Update of products.', function() {
    it('correctly updates product rating when submitting rateProduct mission.', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'rateProduct',
                    outcome: {
                        product: '000000000000000000000101',
                        info: 5
                    },
                    points: 5
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('rateProduct', 'type of mission');
                    expect(res.body.points).toEqual(5, 'points of mission');

                    h.request('GET', h.baseURL + 'location/000000000000000000000006')
                        .end(function(res) {
                            var products = res.body.products;
                            var curry =_.findWhere(products, { id: '000000000000000000000101' });
                            expect(curry).toBeDefined('curry product is defined');
                            expect(curry.rating).toBeDefined('curry has a rating');
                            expect(curry.rating.average).toBe(4.5, 'curry  has correct rating');
                            expect(curry.rating.numRatings).toBe(2, 'curry hast correct number of ratings');

                            var samosa =_.findWhere(products, { id: '000000000000000000000102' });
                            expect(samosa).toBeDefined('samosa product is defined');
                            expect(samosa.rating).toBeDefined('samosa has a rating');
                            expect(samosa.rating.average).toBe(3, 'samosa  has correct unchanged rating');
                            expect(samosa.rating.numRatings).toBe(1, 'samosa hast correct number of ratings');
                            done();
                        })
                    ;
                })
            ;
        });
    });

    it('can update product name with setProductName mission.', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'setProductName',
                    outcome: {
                        product: '000000000000000000000101',
                        info: 'Indian Curry'
                    },
                    points: 0
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('setProductName', 'type of mission');
                    expect(res.body.points).toEqual(0, 'points of mission');

                    h.request('GET', h.baseURL + 'location/000000000000000000000006')
                        .end(function(res) {
                            var products = res.body.products;
                            var curry =_.findWhere(products, { id: '000000000000000000000101' });

                            expect(curry).toBeDefined('curry product is defined');
                            expect(curry.name).toBe('Indian Curry', 'correctly updated name');
                            done();
                        })
                    ;
                })
            ;
        });
    });

    it('can update product availability with setProductAvail mission.', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006',
                    type: 'setProductAvail',
                    outcome: {
                        product: '000000000000000000000101',
                        info: 'unavailable'
                    },
                    points: 5
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('setProductAvail', 'type of mission');
                    expect(res.body.points).toEqual(5, 'points of mission');

                    h.request('GET', h.baseURL + 'location/000000000000000000000006')
                        .end(function(res) {
                            var products = res.body.products;
                            var curry = _.findWhere(products, {id: '000000000000000000000101'});

                            expect(curry).toBeDefined('curry product is defined');
                            expect(curry.availability).toBe('unavailable', 'correctly updated availability');
                            done();
                        })
                    ;
                })
            ;
        });
    });
});

h.describe('Mission API methods and their influence on locations.', function() {
   it('location can change owner when new mission is submitted', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: '000000000000000000000006', // Mission in dosha
                    type: 'visitBonus',
                    outcome: true,
                    points: 50
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.causedOwnerChange).toBe(true, 'mission caused an owner change');

                    // Check how the location looks now
                    h.request('GET', h.baseURL + 'location/000000000000000000000006')
                        .end(function(res) {
                            expect(res.statusCode).toBe(200);

                            var dosha = res.body;
                            expect(dosha).toBeDefined('returned dosha');
                            expect(dosha.team).toBe('team1', 'owner is now team1');
                            expect(typeof dosha.points.team1).toBe('number', 'has team1 points');
                            expect(typeof dosha.points.team2).toBe('number', 'has team2 points');
                            expect(dosha.points.team1).toBeGreaterThan(dosha.points.team2, 'has more team1 than team2 points');

                            done();
                        })
                    ;
                })
            ;
        });
    });
});

fix = new FixtureCreator()
    .user('alice')
    .location('alice', 'Tingelkringel')
;

h.describe('Mission cool down periods.', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('cool down is not affected when submitting mission with 0 points', function() {
        // When a mission with 0 points is submitted, the cool down period should not be affected.
        // This means that the next time we ask for available missions, we should still get points for that mission.
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'offerQuality',
                    outcome: 3,
                    points: 0
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);

                    // Check the available missions
                    h.request('GET', h.baseURL + 'location/' + locationId + '/availableMission/list')
                        .end(function(res) {
                            expect(res.statusCode).toBe(200);

                            var offerQualityMission = res.body.locationMissions.offerQuality;
                            expect(offerQualityMission.points).toBeGreaterThan(0, 'still get points for the same mission');
                            expect(typeof offerQualityMission.lastCompleted).toBe('object', 'has the last completed mission');
                            expect(offerQualityMission.lastCompleted.points.team1).toBe(0, 'really got 0 points for mission');

                            done();
                        })
                    ;
                })
            ;
        });
    });
});
