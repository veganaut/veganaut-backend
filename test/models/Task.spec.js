/**
 * A spec for the Mission models
 */

'use strict';

var h = require('../helpers_');
var Missions = require('../../app/models/Task');

h.describe('A VisitBonusMission', function() {
    var mission;
    beforeAll(function() {
        mission = new Missions.VisitBonusMission({
            person: '000000000000000000000001',
            location: '000000000000000000000006',
            outcome: true
        });
    });

    it('can be saved', function(done) {
        expect(mission.id).toBeTruthy();

        mission.save(function(err) {
            expect(err).toBeNull();
            done();
        });
    });

    it('can be found', function(done) {
        Missions.VisitBonusMission.findById(mission.id).exec(function(err, foundMission) {
            expect(err).toBeNull();
            expect(foundMission instanceof Missions.VisitBonusMission).toBe(true, 'found the created mission');
            expect(foundMission.points).toBe(50, 'points are 50');
            expect(foundMission.person.toString()).toBe('000000000000000000000001', 'got correct person');
            expect(foundMission.location.toString()).toBe('000000000000000000000006', 'got correct location');
            expect(foundMission.isNpcMission).toBe(false, 'by default is not an npc mission');
            done();
        });
    });

    it('can be removed', function(done) {
        Missions.VisitBonusMission.remove(mission).exec(function(err) {
            expect(err).toBeNull();

            Missions.VisitBonusMission.findById(mission.id).exec(function(err, mission) {
                expect(mission).toBeNull('removed the mission');
                expect(err).toBeNull();
                done();
            });
        });
    });
});

h.describe('NPC mission', function() {
    var mission;
    beforeAll(function(done) {
        mission = new Missions.OfferQualityMission({
            person: '000000000000000000000010',
            location: '000000000000000000000007',
            outcome: 2
        });
        mission.save(done);
    });

    it('sets correct values for a mission by an npc', function(done) {
        Missions.OfferQualityMission.findById(mission.id).exec(function(err, foundMission) {
            expect(err).toBeNull();

            expect(typeof foundMission.points).toBeDefined('object', 'points is an object');
            expect(typeof foundMission.points.npc).toBe('undefined', 'no points for npcs');
            expect(foundMission.isNpcMission).toBe(true, 'created an npc mission');
            expect(foundMission.isFirstOfType).toBe(false, 'npc mission can never be first of type');
            done();
        });
    });
});
