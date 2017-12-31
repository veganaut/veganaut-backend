/**
 * A spec for the Location model
 */

'use strict';

var h = require('../helpers_');
var db = require('../../app/models');

h.describe('A location', function() {
    var location, succeeded, failed;
    beforeAll(function() {
        location = db.Location.build({
            coordinates: {
                type: 'Point',
                coordinates: [8.5, 47.21]
            },
            name: 'test',
            type: 'retail'
        });
    });

    beforeEach(function() {
        succeeded = jasmine.createSpy('promiseSucceeded');
        failed = jasmine.createSpy('promiseFailed').and.callFake(function(err) {
            console.log('Promise error:', err);
        });
    });

    it('default values saved and can be saved', function(done) {
        expect(location.existence).toBe('existing', 'default existence');
        expect(location.tags).toEqual({}, 'default tags');

        location.save().then(succeeded).catch(failed)
            .finally(function() {
                expect(succeeded).toHaveBeenCalled();
                expect(failed).not.toHaveBeenCalled();
                expect(typeof location.id).toBe('number', 'got an id');
                done();
            })
        ;
    });

    it('can be found', function(done) {
        db.Location.findById(location.id)
            .then(function(foundLocation) {
                expect(foundLocation instanceof db.Location).toBe(true, 'found the created location');
                expect(typeof foundLocation.updatedAt).toBe('object', 'set an updatedAt date');
                expect(Math.abs(Date.now() - foundLocation.updatedAt.getTime())).toBeLessThan(5000, 'date is about now');
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

    it('does soft deletes', function(done) {
        location.destroy()
            .then(function() {
                return db.Location.findById(location.id);
            })
            .then(function(foundLocation) {
                expect(foundLocation).toBeNull('location was deleted');

                // Load again, including soft deleted records
                return db.Location.findById(location.id, {
                    paranoid: false
                });
            })
            .then(function(foundLocation) {
                expect(foundLocation instanceof db.Location).toBe(true, 'still found it when including soft deleted');
                expect(foundLocation.isSoftDeleted()).toBe(true, 'has soft deleted set to true');
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
