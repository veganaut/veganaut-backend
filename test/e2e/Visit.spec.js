'use strict';
/* global it, expect */

var h = require('../helpers');
var FixtureCreator = require('../fixtures/FixtureCreator').FixtureCreator;

var fix = new FixtureCreator();
fix
    .user('alice', 'blue')
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

    it('returns correct points for all missions', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'visit')
                .send({
                    location: '000000000000000000000003',
                    missions: [
                        { type: 'visitBonus', outcome: true },
                        { type: 'hasOptions', outcome: true },
                        { type: 'whatOptions', outcome: ['fries', 'napoli'] },
                        { type: 'buyOptions', outcome: ['fries'] },
                        { type: 'giveFeedback', outcome: { text: 'Moar sauce', didNotDoIt: false } },
                        { type: 'rateOptions', outcome: { fries: 2, napoli: 6 }}
                    ]
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(res.body.missions.length).toBe(6, 'missions is an array of length 6');
                    expect(res.body.missions[0].type).toBe('visitBonus', 'type of mission 1');
                    expect(res.body.missions[0].points).toEqual({blue: 100}, 'points of mission 1');
                    expect(res.body.missions[1].type).toBe('hasOptions', 'type of mission 2');
                    expect(res.body.missions[1].points).toEqual({blue: 10}, 'points of mission 2');
                    expect(res.body.missions[2].type).toBe('whatOptions', 'type of mission 3');
                    expect(res.body.missions[2].points).toEqual({blue: 10}, 'points of mission 3');
                    expect(res.body.missions[3].type).toBe('buyOptions', 'type of mission 4');
                    expect(res.body.missions[3].points).toEqual({blue: 20}, 'points of mission 4');
                    expect(res.body.missions[4].type).toBe('giveFeedback', 'type of mission 5');
                    expect(res.body.missions[4].points).toEqual({blue: 20}, 'points of mission 5');
                    expect(res.body.missions[5].type).toBe('rateOptions', 'type of mission 6');
                    expect(res.body.missions[5].points).toEqual({blue: 10}, 'points of mission 6');

                    expect(res.body.totalPoints).toEqual({blue: 170}, 'returns the summed up total points');
                    done();
                })
            ;
        });
    });
});
