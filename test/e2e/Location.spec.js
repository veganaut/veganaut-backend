'use strict';
/* global it, expect */

var _ = require('lodash');
var h = require('../helpers');

h.describe('Visit API methods', function() {
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    coordinates: [46.951081, 7.438637],
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
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
                        expect(typeof location.coordinates).toBe('object', 'has coordinates');
                        expect(location.coordinates.length).toBe(2, 'has 2 coordinates');
                        expect(typeof location.coordinates[0]).toBe('number', 'coordinates are numbers');
                        expect(typeof location.coordinates[1]).toBe('number', 'coordinates are numbers');
                        expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');
                        expect(typeof location.currentOwnerStart).toBe('string', 'currentOwnerStart is a string');
                        expect(isNaN(new Date(location.currentOwnerStart).getTime())).toBe(false,
                            'currentOwnerStart can be parsed as a valid date'
                        );

                        expect(location.team).toMatch(/^(blue|green)$/, 'team is blue or green');
                        expect(typeof location.points).toBe('object', 'points is an object');

                        // TODO: should we test the exact points?
                    });
                    done();
                })
            ;
        });
    });
});
