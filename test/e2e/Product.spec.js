'use strict';

var h = require('../helpers_');

h.describe('Product list method as anonymous user', {user: ''}, function() {
    it('can list products', function(done) {
        h.request(h.baseURL + 'product/list?lat=46.95&lng=7.45&radius=5000&limit=1')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(typeof res.body).toBe('object', 'returns an array of products');

                expect(res.body.totalProducts).toBeDefined();
                expect(res.body.totalProducts).toBe(3, 'total found products');
                expect(res.body.products).toBeDefined();
                expect(res.body.products.length).toBe(1, 'limit=1 is working');

                var product = res.body.products[0];
                expect(typeof product).toBe('object', 'its a object');
                expect(typeof product.name).toBe('string', 'has a name');
                expect(product.rating.average).toBeDefined();
                expect(typeof product.rating.average).toBe('number', 'average rating is a number');
                expect(typeof product.rating.numRatings).toBe('number', 'num ratings is a number');
                expect(typeof product.location).toBe('number', 'has a location id');
                expect(product.availability).toBe('always', 'is always available');
                done();
            })
        ;
    });

    it('returns empty result when area does not include any location', function(done) {
        h.request(h.baseURL + 'product/list?lat=48.2&lng=16.4&radius=40000')
            .end(function(err, res) {
                expect(res.body.totalProducts).toBe(0, 'no location found');
                expect(res.body.products.length).toBe(0, 'no location returned');
                done();
            })
        ;
    });

    it('returns next set of items when skip is used', function(done) {
        h.request(h.baseURL + 'product/list?lat=46.95&lng=7.45&radius=5000&skip=1')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.totalProducts).toBe(3, 'still 3 products in total');
                expect(res.body.products.length).toBe(2, 'it contains 2 product (instead of the 3 that exist)');
                done();
            })
        ;
    });

    it('returns all products if no area given', function(done) {
        h.request(h.baseURL + 'product/list')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.totalProducts).toBe(3, 'found 3 products in total');
                expect(res.body.products.length).toBe(3, 'returns the 3 products');
                done();
            })
        ;
    });

    it('can filter products by location type retail', function(done) {
        h.request(h.baseURL + 'product/list?locationType=retail')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.totalProducts).toBe(1, 'total found products');
                expect(res.body.products).toBeDefined();
                expect(res.body.products.length).toBe(1, 'returned 1 product');

                var product = res.body.products[0];
                expect(product.name).toBe('tofu', 'returned the correct retail product');
                done();
            })
        ;
    });

    it('can filter products by location type gastronomy', function(done) {
        h.request(h.baseURL + 'product/list?locationType=gastronomy')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                expect(res.body.totalProducts).toBe(2, 'total found products');
                expect(res.body.products).toBeDefined();
                expect(res.body.products.length).toBe(2, 'returned 2 products');
                done();
            })
        ;
    });
});
