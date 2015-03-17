'use strict';

var h = require('../helpers_');

h.describe('Location API methods as logged in user alice', function() {
    it('can list products', function() {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=4,41,11,52&limit=1')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(typeof res.body).toBe('object', 'returns an array of products');

                    expect(res.body.totalProducts).toBeDefined();
                    expect(res.body.totalProducts).toBe(2, 'total found products');
                    expect(res.body.products).toBeDefined();
                    expect(res.body.products.length).toBe(1, 'limit=1 is working');
                    expect(res.body.includesWholeWorld).toBe(false, 'did not run the query on the whole world');

                    var product = res.body.products[0];
                    expect(typeof product).toBe('object', 'its a object');
                    expect(typeof product.name).toBe('string', 'has a name');
                    expect(product.rating.average).toBeDefined();
                    expect(typeof product.rating.average).toBe('number', 'average rating is a number');
                    expect(typeof product.rating.numRatings).toBe('number', 'num ratings is a number');
                    expect(typeof product.location).toBe('string', 'has a location id');
                    done();
                })
            ;
        });
    });

    it('returns error when bounding box is too big', function() {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=-156,-57,76,89')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.totalProducts).toBe(2, 'found 2 products in total');
                    expect(res.body.products.length).toBe(2, 'returns the 2 products');
                    expect(res.body.includesWholeWorld).toBe(true, 'ran the query on the whole world');
                    done();
                })
            ;
        });
    });

    it('returns empty result when bounding box does not include any location', function() {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=71.2,16.5,85,36')
                .end(function(res) {
                    expect(res.body.totalProducts).toBe(0, 'no location found');
                    expect(res.body.products.length).toBe(0, 'no location returned');
                    done();
                })
            ;
        });
    });

    it('returns next set of items when skip is used', function() {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list?bounds=4,41,11,52&skip=1')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.totalProducts).toBe(2, 'still 2 products in total');
                    expect(res.body.products.length).toBe(1, 'it contains 1 product (instead of the 2 that exist)');
                    expect(res.body.includesWholeWorld).toBe(false, 'did not run the query on the whole world');
                    done();
                })
            ;
        });
    });

    it('returns all products if no bounds given', function() {
        h.runAsync(function(done) {
            h.request(h.baseURL + 'product/list')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.totalProducts).toBe(2, 'found 2 products in total');
                    expect(res.body.products.length).toBe(2, 'returns the 2 products');
                    expect(res.body.includesWholeWorld).toBe(true, 'ran the query on the whole world');
                    done();
                })
            ;
        });
    });
});
