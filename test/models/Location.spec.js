/**
 * A spec for the Location model
 */

'use strict';

var h = require('../helpers_');

var mongoose = require('mongoose');
require('../../app/models/Location');
var Person = mongoose.model('Person');
var Location = mongoose.model('Location');

describe('A location', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/veganaut', done);
        });
    });

    it('can be created and removed', function() {
        var p = new Person();
        var l = new Location({
            owner: p.id
        });
        expect(l.id).toBeTruthy();

        h.runAsync(function(done) {
            l.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Location.findById(l.id).exec(function(err, location) {
                expect(location instanceof Location).toBe(true, 'found the created location');
                expect(location.owner.toString()).toBe(p.id, 'correct owner');
                expect(typeof location.updatedAt).toBe('object', 'set an updatedAt date');
                expect(Math.abs(Date.now() - location.updatedAt.getTime())).toBeLessThan(5000, 'date is about now');
                done();
            });
        });

        h.runAsync(function(done) {
            Location.remove(l).exec(function(err) {
                expect(err).toBeNull();

                Location.findById(l.id).exec(function(err, location) {
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
