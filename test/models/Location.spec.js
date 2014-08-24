/**
 * A spec for the Location model
 */

'use strict';
/* global describe, it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Location');
var Location = mongoose.model('Location');

describe('A location', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/monkey', done);
        });
    });

    it('can be created', function() {
        h.runAsync(function(done) {
            Location.remove().exec(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        var p = new Location();
        expect(p.id).toBeTruthy();

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Location.findOne(p.id).exec(function(err, location) {
                expect(location instanceof Location).toBe(true);
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
