'use strict';

var h = require('../helpers_');
var FixtureCreator = require('../fixtures/FixtureCreator');

var fix = new FixtureCreator();
fix
    .user('anon', 'anonymous')
;
h.describe('Anonymous team behaviour', {fixtures: fix, user: 'anon@example.com'}, function() {
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    lat: 46,
                    lng: 7,
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);

                    var loc = res.body;
                    expect(loc.name, 'TingelKringel', 'correct name');
                    expect(typeof loc.points.anonymous).toBe('undefined', 'no points for anonymous team');
                    expect(loc.points.team1).toBe(0, 'no points for team1');
                    expect(loc.points.team2).toBe(0, 'no points for team2');
                    expect(loc.points.team3).toBe(0, 'no points for team3');
                    expect(loc.points.team4).toBe(0, 'no points for team4');
                    expect(loc.points.team5).toBe(0, 'no points for team5');
                    expect(loc.team).toBe('anonymous', 'location belong to anonymous');
                    done();
                })
            ;
        });
    });
});
