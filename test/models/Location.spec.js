/**JASMINE_CONFIG_PATH
 * A spec for the Location model
 */

'use strict';

require('../helpers_');

var mongoose = require('mongoose');
require('../../app/models/Location');
var Person = mongoose.model('Person');
var Location = mongoose.model('Location');

describe('A location', function() {
    var person, location;
    beforeAll(function(done) {
        mongoose.connect('mongodb://localhost/veganaut', done);
    });

    beforeAll(function() {
        person = new Person();
        location = new Location({
            owner: person.id
        });
    });

    it('can be be saved', function(done) {
        expect(location.id).toBeTruthy();

        location.save(function(err) {
            expect(err).toBeNull();
            done();
        });
    });

    it('can be found', function(done) {
        Location.findById(location.id).exec(function(err, foundLocation) {
            expect(foundLocation instanceof Location).toBe(true, 'found the created location');
            expect(foundLocation.owner.toString()).toBe(person.id, 'correct owner');
            expect(typeof foundLocation.updatedAt).toBe('object', 'set an updatedAt date');
            expect(Math.abs(Date.now() - foundLocation.updatedAt.getTime())).toBeLessThan(5000, 'date is about now');
            done();
        });
    });

    it('can be removed', function(done) {
        Location.remove(location).exec(function(err) {
            expect(err).toBeNull();

            Location.findById(location.id).exec(function(err, location) {
                expect(location).toBeNull('removed the location');
                expect(err).toBeNull();
                done();
            });
        });
    });

    afterAll(function(done) {
        mongoose.disconnect(done);
    });
});
