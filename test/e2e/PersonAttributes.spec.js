'use strict';

var h = require('../helpers_');
var FixtureCreator = require('../fixtures/FixtureCreator').FixtureCreator;

var fix = new FixtureCreator();
fix
    .user('alice', 'team1')
    .location('alice', 'Tingelkringel')
;

var locationName = 'Test Location';
var locationId;
var pioneerCount;
var diplomatCount;
var evaluatorCount;
var gourmetCount;


h.describe('Person Attributes E2E Test', function() {
    beforeEach(function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                expect(res.statusCode).toBe(200);

                var me = res.body;
                pioneerCount = me.attributes.pioneer;
                diplomatCount = me.attributes.diplomat;
                evaluatorCount = me.attributes.evaluator;
                gourmetCount = me.attributes.gourmet;

                expect(me.id).toEqual('000000000000000000000001');
                expect(typeof me.attributes).toEqual('object', 'attributes is a object');
                done();
            });
        });
    });

    it('can submit a addLocation mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: locationName,
                    description: locationName,
                    lat: 46,
                    lng: 7,
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    var location = res.body;
                    locationId = res.body.id;
                    expect(location.name).toBe(locationName, 'set location name');
                    expect(typeof location.id).toBe('string', 'has an id');

                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when addLocation mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when addLocation mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when addLocation mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when addLocation mission completed');

                        done();
                    });
                })
            ;
        });
    });

    it('can submit a hasOptions mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'hasOptions',
                    outcome: 'yes',
                    points: {team1: 10}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when hasOptions mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount + 1, ' diplomat += 1 when hasOptions mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when hasOptions mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when hasOptions mission completed');

                        done();
                    });
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
                    points: {team1: 50}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when visitBonus mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when visitBonus mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when visitBonus mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount + 1, ' gourmet += 1 when visitBonus mission completed');

                        done();
                    });
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
                        {expression: 'vegan', expressionType: 'builtin'},
                        {expression: 'noMeat', expressionType: 'builtin'},
                        {expression: 'ganz vegetarisch', expressionType: 'custom'}
                    ],
                    points: {team1: 10}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when wantVegan mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount + 1, ' diplomat += 1 when wantVegan mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when wantVegan mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when wantVegan mission completed');

                        done();
                    });
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
                            },
                            info: 'available'
                        },
                        {
                            product: {
                                name: 'Smoothie'
                            },
                            info: 'available'
                        }
                    ],
                    points: {team1: 10}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 2, ' pioneer += 2 when whatOptions mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when whatOptions mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when whatOptions mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when whatOptions mission completed');

                        done();
                    });
                })
            ;
        });
    });

    it('can submit buyOptions mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'buyOptions',
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
                    points: {team1: 20}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount, ' pioneer not changed when buyOptions mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when buyOptions mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when buyOptions mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount + 1, ' gourmet += 1 when buyOptions mission completed');

                        done();
                    });
                })
            ;
        });
    });

    it('can submit rateOptions mission', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'mission')
                .send({
                    location: locationId,
                    type: 'rateOptions',
                    outcome: [
                        {
                            product: {
                                name: 'Curry'
                            },
                            info: 5
                        },
                        {
                            product: {
                                name: 'Smoothie'
                            },
                            info: 4
                        }
                    ],
                    points: {team1: 10}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;
                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when rateOptions mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when rateOptions mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1 when rateOptions mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when rateOptions mission completed');

                        done();
                    });
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
                    points: {team1: 10}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;

                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount, ' pioneer not changed when giveFeedback mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount + 1, ' diplomat += 1 when giveFeedback mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when giveFeedback mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when giveFeedback mission completed');

                        done();
                    });
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
                    points: {team1: 20}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('offerQuality', 'type of mission');
                    expect(res.body.points).toEqual({team1: 20}, 'points of mission');
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;

                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when offerQuality mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when offerQuality mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1 when offerQuality mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when offerQuality mission completed');

                        done();
                    });
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
                    points: {team1: 20}
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.type).toBe('effortValue', 'type of mission');
                    expect(res.body.points).toEqual({team1: 20}, 'points of mission');
                    h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        var me = res.body;

                        expect(me.id).toEqual('000000000000000000000001');
                        expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when effortValue mission completed and isFirstOfType');
                        expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when effortValue mission completed');
                        expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1 when effortValue mission completed and isFirstOfType');
                        expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when effortValue mission completed');

                        done();
                    });
                })
            ;
        });
    });

});

