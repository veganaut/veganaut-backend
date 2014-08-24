'use strict';
/* global it, expect */

var h = require('../helpers');
var FixtureCreator = require('../fixtures/FixtureCreator').FixtureCreator;

var fix = new FixtureCreator();
fix
    .user('alice')
    .location('Tingelkringel')
;

h.describe('Visit API methods', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('can create a new visit', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'visit')
                .send({
                    person: 1,
                    location: 2,
                    missions: [
                        {type: 'optionsAvailable', outcome: true, points: {blue: 3}},
                        {type: 'whatOptions', outcome: ['fries', 'napoli'], point: {blue: 3}}
                    ]
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    done();
                })
            ;
        });
    });
});
