/**
 * A spec for the Mission models
 */

'use strict';
/* global it, expect */

var h = require('../helpers_');

var Missions = require('../../app/models/Missions');
var VisitBonusMission = Missions.VisitBonusMission;

h.describe('A VisitBonusMission', function() {
    it('can be created and removed', function() {
        var m = new VisitBonusMission({
            person: '000000000000000000000001',
            location: '000000000000000000000006',
            outcome: true
        });
        expect(m.id).toBeTruthy();

        h.runAsync(function(done) {
            m.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            VisitBonusMission.findById(m.id).exec(function(err, mission) {
                expect(err).toBeNull();
                expect(mission instanceof VisitBonusMission).toBe(true, 'found the created mission');
                expect(mission.points).toBeDefined('points is defined');
                expect(mission.points.team1).toBe(100, 'points for team1 are 100');
                expect(mission.person.toString()).toBe('000000000000000000000001', 'got correct person');
                expect(mission.location.toString()).toBe('000000000000000000000006', 'got correct location');
                done();
            });
        });

        h.runAsync(function(done) {
            VisitBonusMission.remove(m).exec(function(err) {
                expect(err).toBeNull();

                VisitBonusMission.findById(m.id).exec(function(err, mission) {
                    expect(mission).toBeNull('removed the mission');
                    expect(err).toBeNull();
                    done();
                });
            });
        });
    });
});
