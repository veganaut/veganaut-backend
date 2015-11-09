/**
 * A spec for the Person model
 */

'use strict';

require('../helpers_');

var mongoose = require('mongoose');
require('../../app/models/Person');
var Person = mongoose.model('Person');

describe('A person', function() {
    var person;
    beforeAll(function(done) {
        mongoose.connect('mongodb://localhost/veganaut', done);
    });

    beforeAll(function(done) {
        person = new Person({
            email: 'mynewperson@example.com',
            nickname: 'nick',
            password: 'secure'
        });

        // TODO: why is this necessary?
        Person.remove(done);
    });

    it('can be saved', function(done) {
        expect(person.email).toBe('mynewperson@example.com');
        expect(person.id).toBeTruthy();

        person.save(function(err) {
            expect(err).toBeNull();
            done();
        });
    });

    it('can be found', function(done) {
        Person.findById(person.id).exec(function(err, foundPerson) {
            expect(err).toBeNull();
            expect(foundPerson.email).toBe('mynewperson@example.com', 'set e-mail');
            expect(foundPerson.password).not.toBe('secure', 'encrypted the password');
            expect(foundPerson.accountType).toBe('player', 'set the correct default account type');
            expect(typeof foundPerson.createdAt).toBe('object', 'has created at date');
            expect(Math.abs(foundPerson.createdAt.getTime() - Date.now())).toBeLessThan(1000, 'created at is about now');
            done();
        });
    });

    afterAll(function(done) {
        mongoose.disconnect(done);
    });
});
