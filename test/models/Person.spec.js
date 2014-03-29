/**
 * A spec for the Person model
 */

'use strict';
/* global describe, it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Person');
var Person = mongoose.model('Person');

describe('A person', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/monkey', done);
        });
    });

    it('can be created', function() {
        var p = new Person({email: 'foo@bar.baz'});
        expect(p.email).toBe('foo@bar.baz');
        expect(p.id).toBeTruthy();
        expect(p.alienName).toMatch(/Zorg-\d+/);

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Person.findOne(p.id).exec(function(err, person) {
                expect(err).toBeNull();
                expect(person.email).toBe('foo@bar.baz');
                done();
            });
        });
    });

    it('can populate its activities', function() {
        h.runAsync(function(done) {
            h.setupFixtures(function(err) {
                expect(err).toBeUndefined();

                Person.findOne({email: 'foo@bar.baz'}).exec(function(err, person) {
                    expect(err).toBeNull();
                    person.populateActivityLinks(function(err) {
                        expect(err).toBeNull();
                        expect(person._activityLinks.length).toBe(3);
                        done();
                    });
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
