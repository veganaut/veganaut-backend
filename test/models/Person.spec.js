/**
 * A spec for the Person model
 */

'use strict';

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

        var p = new Person({
            email: 'mynewperson@example.com',
            fullName: 'Test',
            nickname: 'nick',
            password: 'secure'
        });
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
                expect(person.email).toBe('mynewperson@example.com', 'set e-mail');
                expect(person.password).not.toBe('secure', 'encrypted the password');
                expect(person.accountType).toBe('player', 'set the correct default account type');
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
