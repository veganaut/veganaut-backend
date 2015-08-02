/**
 * A spec for the Mission models
 */

'use strict';

var h = require('../helpers_');
var Missions = require('../../app/models/Missions');

h.describe('A VisitBonusMission', function() {
    it('can be created and removed', function() {
        var m = new Missions.VisitBonusMission({
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
            Missions.VisitBonusMission.findById(m.id).exec(function(err, mission) {
                expect(err).toBeNull();
                expect(mission instanceof Missions.VisitBonusMission).toBe(true, 'found the created mission');
                expect(mission.points).toBe(50, 'points are 50');
                expect(mission.person.toString()).toBe('000000000000000000000001', 'got correct person');
                expect(mission.location.toString()).toBe('000000000000000000000006', 'got correct location');
                expect(mission.isNpcMission).toBe(false, 'by default is not an npc mission');
                done();
            });
        });

        h.runAsync(function(done) {
            Missions.VisitBonusMission.remove(m).exec(function(err) {
                expect(err).toBeNull();

                Missions.VisitBonusMission.findById(m.id).exec(function(err, mission) {
                    expect(mission).toBeNull('removed the mission');
                    expect(err).toBeNull();
                    done();
                });
            });
        });
    });

    it('sets correct values for a mission by an npc', function() {
        var m = new Missions.OfferQualityMission({
            person: '000000000000000000000010',
            location: '000000000000000000000007',
            outcome: 2
        });

        h.runAsync(function(done) {
            m.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Missions.OfferQualityMission.findById(m.id).exec(function(err, mission) {
                expect(err).toBeNull();

                expect(typeof mission.points).toBeDefined('object', 'points is an object');
                expect(typeof mission.points.npc).toBe('undefined', 'no points for npcs');
                expect(mission.isNpcMission).toBe(true, 'created an npc mission');
                expect(mission.isFirstOfType).toBe(false, 'npc mission can never be first of type');
                done();
            });
        });
    });
});
