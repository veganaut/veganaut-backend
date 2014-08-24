'use strict';
/* global it, expect */

var h = require('../helpers');

h.describe('Visit API methods', function() {
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    coordinates: [46.951081, 7.438637],
                    type: 'gastronomy',
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
                    expect(res.body.length).toBe(4, '4 locations');
                    done();
                })
            ;
        });
    });
});
