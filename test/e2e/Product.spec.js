'use strict';

var _ = require('lodash');
var h = require('../helpers_');


h.describe('Location API methods as logged in user alice', function() {
    it('can list products', function() {
        h.runAsync(function(done) {
          h.request(h.baseURL + 'product/list?bounds=45.0,6.1,48.2,9.1&limit=1')
            .end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(typeof res.body).toBe('object', 'returns an array of products');
                expect(res.body.totalProducts).toBeDefined();
                expect(res.body.totalProducts).toBeLessThan(11, 'its less than limit set');
                expect(res.body.products).toBeDefined();
                expect(res.body.products.length).toBe(1, 'limit=1 is working');
                expect(res.body.totalProducts).toBe(res.body.products.length, 'total length of products');
                _.each(res.body.products, function(product) {
                    expect(typeof product).toBe('object', 'its a object');
                    expect(typeof product.name).toBe('string', 'has a name');
                    expect(product.rating.average).toBeDefined();
                    expect(typeof product.rating.numRatings).toBe('number', 'its a number');
                });
                done();
            });
        });
    });
    it('returns error when bounding box is too big', function () {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=250.0,6.1,48.2,9.1&limit=1')
                .end(function(res) {
                    expect(res.body.error).toBeDefined();
                    expect(res.body.error).toBe('Bounding box is too big');
                    done();
                });
        });
    });
    it('returns empty result when location is not found in database', function() {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=150.0,6.1,48.2,9.1&limit=1')
                .end(function(res) {
                    expect(res.body.totalProducts).toBe(0, 'no location found');
                    expect(res.body.products.length).toBe(0, 'no location returned');
                    done();
                });
        });
    });
    it('returns next set of items when skip is used', function () {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=45.0,6.1,48.2,9.1&limit=1&skip=1')
                .end(function(res) {
                    expect(res.body.totalProducts).toBeDefined();
                    expect(res.body.products.length).toBeGreaterThan(0, 'it contains products');
                    done();
                });
        });
    });
});
