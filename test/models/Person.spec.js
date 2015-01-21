/**
 * A spec for the Person model
 */

'use strict';
/* global describe, it, expect */

var h = require('../helpers_');

var mongoose = require('mongoose');
require('../../app/models/Person');
var Person = mongoose.model('Person');

describe('A person', function() {
    h.beforeAll(function() {
        h.runAsync(function(done) {
            mongoose.connect('mongodb://localhost/veganaut', done);
        });
    });

    it('can be created', function() {
        h.runAsync(function(done) {
            Person.remove().exec(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        var p = new Person({email: 'mynewperson@example.com'});
        expect(p.email).toBe('mynewperson@example.com');
        expect(p.id).toBeTruthy();

        h.runAsync(function(done) {
            p.save(function(err) {
                expect(err).toBeNull();
                done();
            });
        });

        h.runAsync(function(done) {
            Person.findById(p.id).exec(function(err, person) {
                expect(err).toBeNull();
                expect(person.email).toBe('mynewperson@example.com');
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
