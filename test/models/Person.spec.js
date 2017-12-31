/**
 * A spec for the Person model
 */

'use strict';

var h = require('../helpers_');
var db = require('../../app/models');

h.describe('A person', function() {
    var person, succeeded, failed;
    beforeAll(function() {
        person = db.Person.build({
            email: 'mynewperson@example.com',
            nickname: 'nick',
            password: 'secure'
        });
    });

    beforeEach(function() {
        succeeded = jasmine.createSpy('promiseSucceeded');
        failed = jasmine.createSpy('promiseFailed');
    });

    it('default values saved and can be saved', function(done) {
        expect(person.locale).toBe('en', 'default locale');
        expect(person.accountType).toBe('player', 'default accountType');

        person.save().then(succeeded).catch(failed)
            .finally(function() {
                expect(succeeded).toHaveBeenCalled();
                expect(failed).not.toHaveBeenCalled();
                expect(typeof person.id).toBe('number', 'got an id');
                done();
            })
        ;
    });

    it('can be found', function(done) {
        db.Person.findById(person.id)
            .then(function(foundPerson) {
                expect(foundPerson instanceof db.Person).toBe(true, 'found the created person');
                expect(foundPerson.email).toBe('mynewperson@example.com', 'set e-mail');
                expect(foundPerson.password).not.toBe('secure', 'encrypted the password');
                expect(foundPerson.accountType).toBe('player', 'set the correct default account type');
                expect(typeof foundPerson.createdAt).toBe('object', 'has created at date');
                expect(Math.abs(foundPerson.createdAt.getTime() - Date.now())).toBeLessThan(1000, 'created at is about now');

                succeeded();
            })
            .catch(failed)
            .finally(function() {
                expect(succeeded).toHaveBeenCalled();
                expect(failed).not.toHaveBeenCalled();
                done();
            })
        ;
    });
});
