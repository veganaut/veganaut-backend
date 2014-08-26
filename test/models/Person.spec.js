/**
 * A spec for the Person model
 */

'use strict';
/* global describe, it, expect */

var h = require('../helpers');

var mongoose = require('mongoose');
require('../../app/models/Person');
var Person = mongoose.model('Person');

var async = require('async');

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
        expect(p.nickname).toMatch(/Veganaut-\d+/);

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

    it('can compute its strength', function() {
        h.runAsync(function(done) {
            h.setupFixtures(function(err) {
                expect(err).toBeUndefined();

                async.series([
                    function(next) {
                        Person.findOne({email: 'foo@bar.baz'}).exec(function(err, alice) {
                            expect(err).toBeNull();
                            alice.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(alice.getStrength()).toBe(12);
                                next();
                            });
                        });
                    },

                    function(next) {
                        Person.findOne({email: 'im@stoop.id'}).exec(function(err, bob) {
                            expect(err).toBeNull();
                            bob.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(bob.getStrength()).toBe(3);
                                next();
                            });
                        });
                    },

                    function(next) {
                        Person.findOne({fullName: 'Dave Donaldsson'}).exec(function(err, dave) {
                            expect(err).toBeNull();
                            dave.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(dave.getStrength()).toBe(0.5);
                                next();
                            });
                        });
                    }
                ], done);
            });
        });
    });

    it('can compute its hits', function() {
        h.runAsync(function(done) {
            h.setupFixtures(function(err) {
                expect(err).toBeUndefined();

                async.series([
                    function(next) {
                        Person.findOne({email: 'foo@bar.baz'}).exec(function(err, alice) {
                            expect(err).toBeNull();
                            alice.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(alice.getHits()).toBe(0);
                                next();
                            });
                        });
                    },

                    function(next) {
                        Person.findOne({email: 'im@stoop.id'}).exec(function(err, bob) {
                            expect(err).toBeNull();
                            bob.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(bob.getHits()).toBe(1);
                                next();
                            });
                        });
                    }
                ], done);
            });
        });
    });

    it('knows when it\'s captured', function() {
        h.runAsync(function(done) {
            h.setupFixtures(function(err) {
                expect(err).toBeUndefined();

                async.series([
                    function(next) {
                        Person.findOne({email: 'foo@bar.baz'}).exec(function(err, alice) {
                            expect(err).toBeNull();
                            alice.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(alice.isCaptured()).toBe(false);
                                next();
                            });
                        });
                    },

                    function(next) {
                        Person.findOne({email: 'im@stoop.id'}).exec(function(err, bob) {
                            expect(err).toBeNull();
                            bob.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(bob.isCaptured()).toBe(false);
                                next();
                            });
                        });
                    },

                    function(next) {
                        Person.findOne({fullName: 'Dave Donaldsson'}).exec(function(err, dave) {
                            expect(err).toBeNull();
                            dave.populateActivityLinks(function(err) {
                                expect(err).toBeNull();
                                expect(dave.isCaptured()).toBe(false);
                                next();
                            });
                        });
                    }
                ], done);
            });
        });
    });

    h.afterAll(function() {
        h.runAsync(function(done) {
            mongoose.disconnect(done);
        });
    });
});
