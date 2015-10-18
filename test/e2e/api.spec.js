'use strict';

var h = require('../helpers_');

h.describe('Our API', function() {

    it('can connect to server', function(done) {
        h.request('GET', h.baseURL).end(function(err, res) {
            expect(res.statusCode).toBe(200);
            done();
        });
    });
});
