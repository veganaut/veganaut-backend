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
                done();
            })
        ;
    });

    it('can get overview with coordinates and radius', function(done) {
        h.request(h.baseURL + 'panorama?lat=46.956&lng=7.452&radius=150')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var overview = res.body;
                expect(_.isPlainObject(overview)).toBe(true, 'returns a plain object');
                done();
            })
        ;
    });
});
