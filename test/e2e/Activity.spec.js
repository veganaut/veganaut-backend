'use strict';

var h = require('../helpers_');

h.describe('Activity API methods', function() {

    it('can get a list of activity types', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'activity').end(function(res) {
                expect(res.statusCode).toBe(200);
                expect(typeof res.body).toBe('object');
                expect(res.body.length).toBe(2);

                var activity = res.body[0];
                expect(typeof activity.id).toBe('string');
                expect(typeof activity.name).toBe('string');
                expect(typeof activity.className).toBe('string');
                expect(typeof activity.timeLimit).toBe('number');
                done();
            });
        });
    });

});
