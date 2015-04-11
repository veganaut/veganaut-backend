/**
 * A spec for the Location model
 */

'use strict';

var h = require('../helpers_');

var mongoose = require('mongoose');
require('../../app/models/Location');
var Location = mongoose.model('Location');

describe('A location', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/veganaut', done);
        });
    });

    it('can be created and removed', function() {
        var p = new Location();
        expect(p.id).toBeTruthy();

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Location.findById(p.id).exec(function(err, location) {
                expect(location instanceof Location).toBe(true, 'found the created location');
                expect(location.team).toBe('anonymous', 'set a valid default team');
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Location.remove(p).exec(function(err) {
                expect(err).toBeNull();

                Location.findById(p.id).exec(function(err, location) {
                    expect(location).toBeNull('removed the location');
                    expect(err).toBeNull();
                    done();
                });
            });
        });
    });

    h.afterAll(function() {
        h.runAsync(function(done) {
            mongoose.disconnect(done);
        });
    });
});
