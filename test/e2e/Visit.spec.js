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
                    location: '000000000000000000000003',
                    missions: [
                        {type: 'hasOptions', outcome: true},
                        {type: 'whatOptions', outcome: ['fries', 'napoli']}
                    ]
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(typeof res.body.id).toBe('string', 'id is a string');
                    expect(typeof res.body.person).toBe('string', 'person is a string');
                    expect(typeof res.body.location).toBe('string', 'location is a string');
                    expect(typeof res.body.completed).toBe('string', 'completed is a string');
                    expect(res.body.missions.length).toBe(2, 'missions is an array of length 2');
                    expect(res.body.missions[0].type).toBe('hasOptions', 'type of first mission');
                    expect(res.body.missions[0].outcome).toBe(true, 'outcome of first mission');
                    expect(res.body.missions[1].type).toBe('whatOptions', 'type of second mission');
                    expect(res.body.missions[1].outcome).toEqual(['fries', 'napoli'], 'outcome of second mission');
                    done();
                })
            ;
        });
    });
});
