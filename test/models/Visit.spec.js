/**
 * A spec for the Visit model
 */

'use strict';
/* global it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Visit');
var Visit = mongoose.model('Visit');

h.describe('A visit', function() {
    it('can be created and removed', function() {
        var p = new Visit();
        expect(p.id).toBeTruthy();

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Visit.findById(p.id).exec(function(err, location) {
                expect(location instanceof Visit).toBe(true, 'found the created visit');
                expect(err).toBeNull();
                done();
            });
        });


        h.runAsync(function(done) {
            Visit.remove(p).exec(function(err) {
                expect(err).toBeNull();

                Visit.findById(p.id).exec(function(err, visit) {
                    expect(visit).toBeNull('removed the visit');
                    expect(err).toBeNull();
                    done();
                });
            });
        });
    });

    it('gets all fields set', function() {
        h.runAsync(function(done) {
            Visit.findOne().exec(function(err, visit) {
                expect(err).toBeNull('no database error');
                expect(visit instanceof Visit).toBe(true, 'got result');
                expect(visit.missions.length >= 1).toBe(true, 'got missions in result');
                if (!err && visit && visit.missions.length >= 1) {
                    var mission = visit.missions[0];
                    expect(typeof mission.type).toBe('string', 'type is a string');
                    expect(mission.outcome).toBeDefined('outcome is defined');
                    expect(mission.points).toBeDefined('points is defined');
                }
                done();
            });
        });
    });
});
