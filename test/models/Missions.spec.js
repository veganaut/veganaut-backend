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
        var m = new VisitBonusMission({});
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
                expect(mission.points.team1).toBe(0, 'points for team1 is 0');
                expect(mission.points.team2).toBe(0, 'points for team2 is 0');
                expect(mission.points.team3).toBe(0, 'points for team3 is 0');
                expect(mission.points.team4).toBe(0, 'points for team4 is 0');
                expect(mission.points.team5).toBe(0, 'points for team5 is 0');
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
