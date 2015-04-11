'use strict';

var h = require('../helpers_');

h.describe('Logged in as anonymous team member', {user: 'anon@example.com'}, function() {
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

h.describe('Anonymous team members from outside this team', function() {
    it('cannot get the details of a member of the anonymous team', function() {
        h.runAsync(function(done) {
            // Try to get anon@example.com
            h.request('GET', h.baseURL + 'person/000000000000000000000010')
                .end(function(res) {
                    expect(res.statusCode).toBe(404, 'anonymous person not found');
                    expect(typeof res.body.error).toBe('string', 'got an error message');
                    done();
                })
            ;
        });
    });
});
