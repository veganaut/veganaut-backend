'use strict';

var h = require('../helpers_');

h.describe('GeoIP', function() {
    it('can get map zoom from IP', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'geoip')
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200);
                    expect(typeof res.body).toBe('object', 'returns object');

                    // No further testing because geoip can't handle 127.0.0.1 (localhost)

                    done();
                })
            ;
        });
    });
});
