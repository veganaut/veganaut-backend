/**
 * A spec for the Mission model
 */

'use strict';
/* global describe, it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Mission');
var Mission = mongoose.model('Mission');

describe('A mission', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/monkey', done);
        });
    });

    it('can be created', function() {
        h.runAsync(function(done) {
            Mission.remove().exec(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        var p = new Mission();
        expect(p.id).toBeTruthy();

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Mission.findOne(p.id).exec(function(err, mission) {
                expect(mission instanceof Mission).toBe(true);
                expect(err).toBeNull();
                done();
            });
        });
    });
});
