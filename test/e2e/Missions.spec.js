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
    it('can submit a hasOptions mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'hasOptions',
                outcome: 'yes',
                points: 10
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var mission = res.body;
                expect(typeof mission.id).toBe('string', 'id is a string');
                expect(typeof mission.person).toBe('string', 'person is a string');
                expect(typeof mission.location).toBe('string', 'location is a string');
                expect(typeof mission.completed).toBe('string', 'completed is a string');
                expect(mission.points).toBe(10, 'points of mission');
                expect(mission.type).toBe('hasOptions', 'type is hasOptions');
                expect(mission.causedOwnerChange).toBe(false, 'did not cause an owner change');
                expect(mission.outcome).toBe('yes', 'outcome of the mission');
                done();
            })
        ;
    });

    it('hasOptions has a cool down period and gives 0 points when submitted again', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'hasOptions',
                outcome: 'yes',
                points: 10 // Try to submit with 10 points, but should be corrected to 0
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.points).toEqual(0, 'got 0 points');
                done();
            })
        ;
    });

    it('can submit visitBonus mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'visitBonus',
                outcome: true,
                points: 50
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('visitBonus', 'type of mission');
                expect(res.body.points).toEqual(50, 'points of mission');
                done();
            })
        ;
    });

    it('can submit wantVegan mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'wantVegan',
                outcome: [
                    {expression: 'vegan', expressionType: 'builtin'},
                    {expression: 'noMeat', expressionType: 'builtin'},
                    {expression: 'ganz vegetarisch', expressionType: 'custom'}
                ],
                points: 10
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('wantVegan', 'type of mission');
                expect(res.body.points).toEqual(10, 'points of mission');
                done();
            })
        ;
    });

    it('can submit whatOptions mission', function(done) {
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
            .end(function(err, res) {
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

    it('can submit giveFeedback mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'giveFeedback',
                outcome: 'Moar sauce',
                points: 10
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('giveFeedback', 'type of mission');
                expect(res.body.points).toEqual(10, 'points of mission');
                done();
            })
        ;
    });

    it('can submit offerQuality mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'offerQuality',
                outcome: 4,
                points: 20
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('offerQuality', 'type of mission');
                expect(res.body.points).toEqual(20, 'points of mission');
                done();
            })
        ;
    });

    it('can submit effortValue mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'effortValue',
                outcome: 'no',
                points: 20
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('effortValue', 'type of mission');
                expect(res.body.points).toEqual(20, 'points of mission');
                done();
            })
        ;
    });

    // Test validation with a few invalid submissions
    it('cannot submit bogus visitBonus mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'visitBonus',
                // missing outcome
                points: 100
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });

    it('cannot submit bogus wantVegan mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'wantVegan',
                outcome: {bogusValue: 'this is not an array'},
                points: 10
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });

    it('cannot submit bogus wantVegan mission: validate inner outcome object', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'wantVegan',
                outcome: [
                    {expression: 'bogus', expressionType: 'bogusValue'}
                ],
                points: 10
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });

    it('cannot submit a bogus offerQuality mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'offerQuality',
                outcome: 100,  // That's way too large for a 1-5 rating
                points: 10
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });


});

h.describe('Product missions referring to existing products.', function() {
    it('can submit rateProduct mission', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('rateProduct', 'type of mission');
                expect(res.body.points).toEqual(5, 'points of mission');
                done();
            })
        ;
    });

    it('can submit buyOptions mission', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('buyOptions', 'type of mission');
                expect(res.body.points).toEqual(20, 'points of mission');
                done();
            })
        ;
    });

    it('can submit setProductName mission', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('setProductName', 'type of mission');
                expect(res.body.points).toEqual(0, 'points of mission');
                done();
            })
        ;
    });

    it('can submit setProductAvail mission', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('setProductAvail', 'type of mission');
                expect(res.body.points).toEqual(5, 'points of mission');
                done();
            })
        ;
    });
});

h.describe('Update of products.', function() {
    it('correctly updates product rating when submitting rateProduct mission.', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('rateProduct', 'type of mission');
                expect(res.body.points).toEqual(5, 'points of mission');

                h.request('GET', h.baseURL + 'location/000000000000000000000006')
                    .end(function(err, res) {
                        var products = res.body.products;
                        var curry = _.findWhere(products, {id: '000000000000000000000101'});
                        expect(curry).toBeDefined('curry product is defined');
                        expect(curry.rating).toBeDefined('curry has a rating');
                        expect(curry.rating.average).toBe(4.5, 'curry  has correct rating');
                        expect(curry.rating.numRatings).toBe(2, 'curry hast correct number of ratings');

                        var samosa = _.findWhere(products, {id: '000000000000000000000102'});
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

    it('can update product name with setProductName mission.', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('setProductName', 'type of mission');
                expect(res.body.points).toEqual(0, 'points of mission');

                h.request('GET', h.baseURL + 'location/000000000000000000000006')
                    .end(function(err, res) {
                        var products = res.body.products;
                        var curry = _.findWhere(products, {id: '000000000000000000000101'});

                        expect(curry).toBeDefined('curry product is defined');
                        expect(curry.name).toBe('Indian Curry', 'correctly updated name');
                        done();
                    })
                ;
            })
        ;
    });

    it('can update product availability with setProductAvail mission.', function(done) {
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
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('setProductAvail', 'type of mission');
                expect(res.body.points).toEqual(5, 'points of mission');

                h.request('GET', h.baseURL + 'location/000000000000000000000006')
                    .end(function(err, res) {
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

h.describe('Mission API methods and their influence on locations.', function() {
    it('location can change owner when new mission is submitted', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: '000000000000000000000006', // Mission in dosha
                type: 'visitBonus',
                outcome: true,
                points: 50
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.causedOwnerChange).toBe(true, 'mission caused an owner change');

                // Check how the location looks now
                h.request('GET', h.baseURL + 'location/000000000000000000000006')
                    .end(function(err, res) {
                        expect(res.statusCode).toBe(200);

                        var dosha = res.body;
                        expect(dosha).toBeDefined('returned dosha');
                        expect(dosha.owner.id).toBe('000000000000000000000001', 'Alice is now owner');
                        expect(dosha.owner.nickname).toBe('Alice', 'Got correct owner nickname');
                        var alicePoints = dosha.points['000000000000000000000001'];
                        var bobPoints = dosha.points['000000000000000000000002'];
                        expect(alicePoints).toBeGreaterThan(0, 'Alice has points');
                        expect(bobPoints).toBeGreaterThan(0, 'Bob has points');
                        expect(alicePoints).toBeGreaterThan(bobPoints, 'Alice hsa more points than Bob');

                        done();
                    })
                ;
            })
        ;
    });
});

fix = new FixtureCreator()
    .user('alice')
    .location('alice', 'Tingelkringel')
;

h.describe('Mission cool down periods.', {fixtures: fix, user: 'alice@example.com'}, function() {
    // When a mission with 0 points is submitted (because the mission is cooling down)
    // Then the mission should still be cooling down afterwards, since it should take
    // the initial mission with more than 0 points into account.
    // TODO: Should find a way to test that the mission with 0 point doesn't reset the cool down (so that it would take longer to cool down)
    it('cool down is not cancelled when submitting a mission with 0 points', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'offerQuality',
                outcome: 3,
                points: 20
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);

                // Check the available missions
                h.request('GET', h.baseURL + 'location/' + locationId + '/availableMission/list')
                    .end(function(err, res) {
                        expect(res.statusCode).toBe(200);

                        var offerQualityMission = res.body.locationMissions.offerQuality;
                        expect(offerQualityMission.points).toBe(0, 'get no more points for the mission');
                        expect(typeof offerQualityMission.lastCompleted).toBe('object', 'has the last completed mission');
                        expect(offerQualityMission.lastCompleted.points).toBe(20, 'got points for this mission');

                        // Submit the mission again
                        h.request('POST', h.baseURL + 'mission')
                            .send({
                                location: locationId,
                                type: 'offerQuality',
                                outcome: 2,
                                points: 0
                            })
                            .end(function(err, res) {
                                expect(res.statusCode).toBe(201);

                                // Check the available missions again
                                h.request('GET', h.baseURL + 'location/' + locationId + '/availableMission/list')
                                    .end(function(err, res) {
                                        expect(res.statusCode).toBe(200);

                                        var offerQualityMission = res.body.locationMissions.offerQuality;
                                        expect(offerQualityMission.points).toBe(0, 'still get no points for the mission');
                                        expect(typeof offerQualityMission.lastCompleted).toBe('object', 'has the last completed mission');
                                        expect(offerQualityMission.lastCompleted.points).toBe(0, 'really got 0 points for mission');

                                        done();
                                    })
                                ;
                            })
                        ;

                    })
                ;
            })
        ;
    });
});
