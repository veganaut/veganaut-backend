'use strict';
/* global it, expect */

var _ = require('lodash');
var h = require('../helpers');
var FixtureCreator = require('../fixtures/FixtureCreator').FixtureCreator;

var fix = new FixtureCreator();
fix
    .user('alice', 'blue')
    .location('alice', 'Tingelkringel')
;

h.describe('Basic functionality of Visit API methods.', {fixtures: fix, user: 'alice@example.com'}, function() {
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
                    expect(res.statusCode).toBe(201);
                    var visit = res.body;
                    expect(typeof visit.id).toBe('string', 'id is a string');
                    expect(typeof visit.person).toBe('string', 'person is a string');
                    expect(typeof visit.location).toBe('string', 'location is a string');
                    expect(typeof visit.completed).toBe('string', 'completed is a string');
                    expect(typeof visit.completed).toBe('string', 'completed is a string');
                    expect(visit.causedOwnerChange).toBe(false, 'did not cause an owner change');
                    expect(visit.missions.length).toBe(2, 'missions is an array of length 2');
                    expect(visit.missions[0].type).toBe('hasOptions', 'type of first mission');
                    expect(visit.missions[0].outcome).toBe(true, 'outcome of first mission');
                    expect(visit.missions[1].type).toBe('whatOptions', 'type of second mission');
                    expect(visit.missions[1].outcome).toEqual(['fries', 'napoli'], 'outcome of second mission');
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
                    expect(res.statusCode).toBe(201);
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

h.describe('Visit API methods and their influence on locations.', function() {
    it('location can change owner when new visit is submitted', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'visit')
                .send({
                    location: '000000000000000000000006', // Visit dosha
                    missions: [
                        {type: 'visitBonus', outcome: true},
                        {type: 'hasOptions', outcome: true},
                        {type: 'whatOptions', outcome: ['curry', 'samosa']},
                        {type: 'buyOptions', outcome: ['samosa']},
                        {type: 'giveFeedback', outcome: { text: 'Tasty vegan options', didNotDoIt: false}}
                    ]
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(201);
                    expect(res.body.causedOwnerChange).toBe(true, 'visit caused an owner change');

                    // TODO: would be best to only request the updated location
                    h.request('GET', h.baseURL + 'location/list')
                        .end(function(res) {
                            expect(res.statusCode).toBe(200);

                            var dosha = _.first(_.where(res.body, {id: '000000000000000000000006'}));
                            expect(dosha).toBeDefined('returned dosha');
                            expect(dosha.team).toBe('blue', 'owner is now blue');
                            expect(typeof dosha.points.blue).toBe('number', 'has blue points');
                            expect(typeof dosha.points.green).toBe('number', 'has blue points');
                            expect(dosha.points.blue).toBeGreaterThan(dosha.points.green, 'has more blue than green points');

                            expect(typeof dosha.currentOwnerStart).toBe('string', 'currentOwnerStart is defined');
                            expect(Date.now() - new Date(dosha.currentOwnerStart)).toBeLessThan(1000, 'currentOwnerStart is less than a second ago');

                            done();
                        })
                    ;
                })
            ;
        });
    });
});
