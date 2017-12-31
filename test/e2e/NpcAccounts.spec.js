'use strict';

var h = require('../helpers_');

h.describe('Logged in as an NPC', {user: 'npc@example.com'}, function() {
    it('can create a new location', function(done) {
        h.request('POST', h.baseURL + 'location')
            .send({
                name: 'Tingelkringel',
                lat: 46,
                lng: 7,
                type: 'gastronomy'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var loc = res.body;
                expect(loc.name, 'TingelKringel', 'correct name');
                // TODO WIP: check that the NPC is not exposed somehow (at the moment it isn't...)
                done();
            })
        ;
    });

    it('can submit a task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6, // Task in dosha
                type: 'HaveYouBeenHereRecently',
                outcome: {
                    beenHere: 'yes'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);

                var task = res.body;
                expect(task.type).toBe('HaveYouBeenHereRecently', 'sanity check on task type');
                // TODO WIP: check that no points / whatever is given
                done();
            })
        ;
    });
});

h.describe('NPCs viewed from player accounts', function() {
    it('cannot get the details of an npc', function(done) {
        // Try to get npc@example.com
        h.request('GET', h.baseURL + 'person/10')
            .end(function(err, res) {
                expect(res.statusCode).toBe(404, 'npc not found');
                expect(typeof res.body.error).toBe('string', 'got an error message');
                done();
            })
        ;
    });
});
