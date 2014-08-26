/**
 * A spec for the Visit model
 */

'use strict';
/* global describe, it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Visit');
var Visit = mongoose.model('Visit');

describe('A visit', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/veganaut', done);
        });
    });

    it('can be created', function() {
        h.runAsync(function(done) {
            Visit.remove().exec(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        var p = new Visit();
        expect(p.id).toBeTruthy();

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Visit.findOne(p.id).exec(function(err, visit) {
                expect(visit instanceof Visit).toBe(true);
                expect(err).toBeNull();
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
