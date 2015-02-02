'use strict';

var _ = require('lodash');
var h = require('../helpers_');


h.describe('Location API methods as logged in user alice', function() {
      it('can list products', function() {
    h.runAsync(function(done) {
      h.request(h.baseURL + 'product/list?bounds=45.0,6.1,48.2,9.1&limit=10')
        .end(function(res) {
          expect(res.statusCode).toBe(200);
          expect(typeof res.body).toBe('object', 'returns an array of products');
          expect(res.body.totalProducts).toBeDefined();
          expect(res.body.totalProducts).toBeLessThan(11, 'its less than limit set');
          expect(res.body.products).toBeDefined();
          expect(res.body.totalProducts).toBe(res.body.products.length, 'total length of products');
          _.each(res.body.products, function(product) {
            expect(typeof product).toBe('object', 'its a object');
            expect(typeof product.name).toBe('string', 'has a name');
            expect(product.rating.average).toBeDefined();
            expect(typeof product.rating.numRatings).toBe('number', 'its a number');
          });
        });
      done();
    });
  });
      /*
      STRANGE BEHAVIOUR, TEST DOESN'T RUN, IF THIS CODE IS NOT HERE, I CAN'T FIGURE OUT WHY, BUT THE ERROR IS BELOW
      Error: connect ECONNREFUSED
    at errnoException (net.js:901:11)
    at Object.afterConnect [as oncomplete] (net.js:892:19)

      */
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    description: 'Bagels',
                    link: 'http://example.com',
                    lat: 46,
                    lng: 7,
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    var location = res.body;
                    expect(location.name).toBe('Tingelkringel', 'set correct name');
                    expect(location.description).toBe('Bagels', 'set correct description');
                    expect(location.link).toBe('http://example.com', 'set correct link');
                    expect(location.lat).toBe(46, 'set correct lat');
                    expect(location.lng).toBe(7, 'set correct lng');
                    expect(location.type).toBe('gastronomy', 'set correct type');
                    expect(typeof location.id).toBe('string', 'has an id');
                    expect(typeof location.lastMissionDates).toMatch('object', 'lastMissionDates is an object');
                    expect(location.team).toBe('team1', 'team is team1');
                    expect(typeof location.points).toBe('object', 'points is an object');
                    expect(location.points.team1).toBeGreaterThan(0, 'has some team1 points');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(location.quality.average).toBe(0, 'quality is at 0 by default');
                    expect(location.quality.numRatings).toBe(0, 'quality numRatings is at 0 by default');

                    done();
                })
            ;
        });
    });
});
