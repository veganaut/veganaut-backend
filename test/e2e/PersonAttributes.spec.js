'use strict';

var h = require('../helpers_');
var FixtureCreator = require('../fixtures/FixtureCreator');

var fix = new FixtureCreator();
fix
    .user('alice')
    .location('alice', 'Tingelkringel')
    .product('Tingelkringel', 'Bagel')
;

var fixtures = fix.getFixtures();
var userId = fixtures['alice'].id;
var locationId = fixtures['Tingelkringel'].id;
var productId = fixtures['product.Bagel'].id;
var pioneerCount;
var diplomatCount;
var evaluatorCount;
var gourmetCount;

var getAttributeValues = function(done) {
    h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
        expect(res.statusCode).toBe(200);

        var me = res.body;
        expect(typeof me.attributes).toEqual('object', 'attributes is a object');
        pioneerCount = me.attributes.pioneer;
        diplomatCount = me.attributes.diplomat;
        evaluatorCount = me.attributes.evaluator;
        gourmetCount = me.attributes.gourmet;

        done();
    });
};


h.describe('Person Attributes E2E Test.', {fixtures: fix, user: 'alice@example.com'}, function() {
    beforeEach(getAttributeValues);

    it('can submit a addLocation mission', function(done) {
        h.request('POST', h.baseURL + 'location')
            .send({
                name: 'Test',
                lat: 46,
                lng: 7,
                type: 'gastronomy'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                // Get the new person data (via person/me)
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when addLocation mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when addLocation mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when addLocation mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when addLocation mission completed');

                    done();
                });
            })
        ;
    });

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
                // Get the new person data (via person/me)
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when hasOptions mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount + 1, ' diplomat += 1 when hasOptions mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when hasOptions mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when hasOptions mission completed');

                    done();
                });
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
                // Get the new person data (via person/me)
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when visitBonus mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when visitBonus mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when visitBonus mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount + 1, ' gourmet += 1 when visitBonus mission completed');

                    done();
                });
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
                // Get the new person data (via person/me)
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when wantVegan mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount + 1, ' diplomat += 1 when wantVegan mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when wantVegan mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when wantVegan mission completed');

                    done();
                });
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
                // Get the new person data (via person/me)
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 2, ' pioneer += 2 when whatOptions mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when whatOptions mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when whatOptions mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when whatOptions mission completed');

                    done();
                });
            })
        ;
    });

    it('can submit buyOptions mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'buyOptions',
                outcome: [
                    {
                        product: productId
                    }
                ],
                points: 20
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/' + userId).end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount, ' pioneer not changed when buyOptions mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when buyOptions mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when buyOptions mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount + 1, ' gourmet += 1 when buyOptions mission completed');

                    done();
                });
            })
        ;
    });

    it('can submit rateProduct mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'rateProduct',
                outcome: {
                    product: productId,
                    info: 5
                },
                points: 5
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/' + userId).end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when rateProduct mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when rateProduct mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1 when rateProduct mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when rateProduct mission completed');

                    done();
                });
            })
        ;
    });

    it('can submit setProductName mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'setProductName',
                outcome: {
                    product: productId,
                    info: 'test'
                },
                points: 0
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/' + userId).end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount, ' pioneer not changed');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed');

                    done();
                });
            })
        ;
    });

    it('can submit setProductAvail mission', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                location: locationId,
                type: 'setProductAvail',
                outcome: {
                    product: productId,
                    info: 'temporarilyUnavailable'
                },
                points: 5
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                h.request('GET', h.baseURL + 'person/me').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount, ' pioneer not changed');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed');

                    done();
                });
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
                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/' + userId).end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount, ' pioneer not changed when giveFeedback mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount + 1, ' diplomat += 1 when giveFeedback mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount, ' evaluator not changed when giveFeedback mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when giveFeedback mission completed');

                    done();
                });
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
                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/' + userId).end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
                    expect(me.attributes.pioneer).toEqual(pioneerCount + 1, ' pioneer += 1 when offerQuality mission completed and isFirstOfType');
                    expect(me.attributes.diplomat).toEqual(diplomatCount, ' diplomat not changed when offerQuality mission completed');
                    expect(me.attributes.evaluator).toEqual(evaluatorCount + 1, ' evaluator += 1 when offerQuality mission completed and isFirstOfType');
                    expect(me.attributes.gourmet).toEqual(gourmetCount, ' gourmet not changed when offerQuality mission completed');

                    done();
                });
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
                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/' + userId).end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
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


// Use the basic fixtures for this more complicated scenarios
h.describe('Person Attributes E2E Test with basic fixtures.', function() {
    beforeEach(getAttributeValues);

    it('ignores npc missions when calculating person attribute changes for submitted missions', function(done) {
        h.request('POST', h.baseURL + 'mission')
            .send({
                // Post a type of mission that an npc already did at this location
                location: '000000000000000000000009',
                type: 'offerQuality',
                outcome: 4,
                points: 20
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('offerQuality', 'type of mission');
                expect(res.body.points).toEqual(20, 'points of mission');

                // Get new person data (via person/{id} to test if that is also correctly updated)
                h.request('GET', h.baseURL + 'person/000000000000000000000001').end(function(err, res) {
                    expect(res.statusCode).toBe(200);

                    var me = res.body;
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
