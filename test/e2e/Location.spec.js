'use strict';
/* global it, expect */

var _ = require('lodash');
var h = require('../helpers_');


h.describe('Location API methods as logged in user alice', function() {
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    lat: 46,
                    lng: 7,
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    var location = res.body;
                    expect(location.name).toBe('Tingelkringel', 'set correct name');
                    expect(location.lat).toBe(46, 'set correct lat');
                    expect(location.lng).toBe(7, 'set correct lng');
                    expect(location.type).toBe('gastronomy', 'set correct type');
                    expect(typeof location.id).toBe('string', 'has an id');
                    expect(typeof location.lastMissionDates).toMatch('object', 'lastMissionDates is an object');
                    expect(location.team).toBe('team1', 'team is team1');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(location.points.team1).toBeGreaterThan(0, 'has some team1 points');
                    expect(location.quality).toBe(0, 'quality is at 0 by default');

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
                    expect(res.body.length).toBe(4, '4 locations (3 from fixtures, one from previous test)');

                    _.each(res.body, function(location) {
                        expect(typeof location.name).toBe('string', 'has a name');
                        expect(typeof location.lat).toBe('number', 'has lat');
                        expect(typeof location.lng).toBe('number', 'has lng');
                        expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');
                        expect(typeof location.lastMissionDates).toMatch('object', 'lastMissionDates is an object');

                        expect(location.team).toMatch(/^(team1|team2)$/, 'team is team1 or team2');
                        expect(typeof location.points).toBe('object', 'points is an object');
                        // TODO: should we test the exact points?
                        expect(typeof location.quality).toBe('number', 'quality is an number');
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
                    expect(typeof location.team).toBe('string', 'team is a string');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(typeof location.points.team1).toBe('number', 'points.team1 is a number');
                    expect(typeof location.products).toBe('object', 'got an array of products');
                    expect(typeof location.quality).toBe('number', 'quality is an number');
                    expect(location.products.length).toBeGreaterThan(0, 'got some products');

                    _.each(location.products, function(product) {
                        expect(typeof product.name).toBe('string', 'has a name');
                        expect(typeof product.id).toBe('string', 'has an id');
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
                    expect(Object.keys(location.lastMissionDates).length).toMatch(2, 'has  lastMissionDates set');
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
                    expect(typeof location.quality).toBe('number', 'quality is an number');
                    expect(location.products.length).toBe(0, 'got products array');

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
});


h.describe('Location API methods anonymous user', { user: '' }, function() {
    it('can list locations', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/list')
            .end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(typeof res.body).toBe('object', 'returns an array of locations');
                expect(res.body.length).toBe(3, 'has 3 locations');

                _.each(res.body, function(location) {
                    expect(typeof location.name).toBe('string', 'has a name');
                    expect(typeof location.lat).toBe('number', 'has lat');
                    expect(typeof location.lng).toBe('number', 'has lng');
                    expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');
                    expect(typeof location.lastMissionDates).toMatch('undefined', 'no lastMissionDates set');
                    expect(location.team).toMatch(/^(team1|team2)$/, 'team is team1 or team2');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(typeof location.quality).toBe('number', 'quality is an number');
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
                    expect(typeof location.products).toBe('object', 'got an array of products');
                    expect(location.products.length).toBeGreaterThan(0, 'got some products');

                    _.each(location.products, function(product) {
                        expect(typeof product.name).toBe('string', 'has a name');
                        expect(typeof product.id).toBe('string', 'has an id');
                        expect(typeof product.rating).toBe('number', 'has a rating');
                    });

                    done();
                })
            ;
        });
    });
});
