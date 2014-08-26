/**
 * A spec for the Mission model
 */

'use strict';
/* global it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Visit');
var Visit = mongoose.model('Visit');

h.describe('A mission', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/veganaut', done);
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

    h.afterAll(function() {
        h.runAsync(function(done) {
            mongoose.disconnect(done);
        });
    });
});
