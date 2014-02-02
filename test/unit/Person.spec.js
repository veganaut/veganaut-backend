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
        mongoose.connect('mongodb://localhost/monkey');
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

    h.afterAll(function() {
        mongoose.disconnect();
    });
});
