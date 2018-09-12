'use strict';

var _ = require('lodash');
var h = require('../helpers_');


h.describe('Panorama API methods when not logged in.', {user: ''}, function() {
    it('can get overview of whole world', function(done) {
        h.request('GET', h.baseURL + 'panorama')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var overview = res.body;
                expect(_.isPlainObject(overview)).toBe(true, 'returns a plain object');
                expect(Object.keys(overview).length).toBe(2, 'correct amount of stats');
                expect(_.isPlainObject(overview.locations)).toBe(true, 'has locations stats');
                expect(Object.keys(overview.locations).length).toBe(4, 'amount of location stats');
                expect(overview.locations.total).toBe(4, 'amount of locations');
                expect(overview.locations.retail).toBe(2, 'amount of retail locations');
                expect(overview.locations.gastronomy).toBe(2, 'amount of gastronomy locations');
                expect(overview.locations.quality).toEqual([2, 0, 0, 1, 1, 0], 'quality of locations');

                expect(_.isPlainObject(overview.products)).toBe(true, 'has products stats');
                expect(Object.keys(overview.products).length).toBe(3, 'amount of products stats');
                expect(overview.products.total).toBe(3, 'amount of products');
                expect(overview.products.retail).toBe(1, 'amount of retail products');
                expect(overview.products.gastronomy).toBe(2, 'amount of gastronomy products');

                done();
            })
        ;
    });

    it('can get overview with coordinates and radius', function(done) {
        // Area that includes only 3dosha
        h.request(h.baseURL + 'panorama?lat=46.956&lng=7.452&radius=150')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var overview = res.body;
                expect(_.isPlainObject(overview)).toBe(true, 'returns a plain object');
                expect(Object.keys(overview).length).toBe(2, 'correct amount of stats');
                expect(_.isPlainObject(overview.locations)).toBe(true, 'has locations stats');
                expect(Object.keys(overview.locations).length).toBe(4, 'amount of location stats');
                expect(overview.locations.total).toBe(1, 'amount of locations');
                expect(overview.locations.retail).toBe(0, 'amount of retail locations');
                expect(overview.locations.gastronomy).toBe(1, 'amount of gastronomy locations');
                expect(overview.locations.quality).toEqual([1, 0, 0, 0, 0, 0], 'quality of locations');

                expect(_.isPlainObject(overview.products)).toBe(true, 'has products stats');
                expect(Object.keys(overview.products).length).toBe(3, 'amount of products stats');
                expect(overview.products.total).toBe(2, 'amount of products');
                expect(overview.products.retail).toBe(0, 'amount of retail products');
                expect(overview.products.gastronomy).toBe(2, 'amount of gastronomy products');

                done();
            })
        ;
    });
});
