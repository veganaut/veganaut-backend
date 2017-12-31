/**
 * A spec for the Task model
 */

'use strict';

var h = require('../helpers_');
var db = require('../../app/models');

h.describe('A HaveYouBeenHereRecently task', function() {
    var task, succeeded, failed;
    beforeAll(function() {
        task = db.Task.build({
            type: 'HaveYouBeenHereRecently',
            locationId: 6,
            personId: 1,
            outcome: {
                beenHere: 'yes'
            }
        });
    });

    beforeEach(function() {
        succeeded = jasmine.createSpy('promiseSucceeded');
        failed = jasmine.createSpy('promiseFailed');
    });

    it('default values saved and can be saved', function(done) {
        expect(task.skipped).toBe(false, 'skipped default value');
        expect(task.byNpc).toBe(false, 'byNpc default value');

        task.save().then(succeeded).catch(failed)
            .finally(function() {
                expect(succeeded).toHaveBeenCalled();
                expect(failed).not.toHaveBeenCalled();
                expect(typeof task.id).toBe('number', 'got an id');
                done();
            })
        ;
    });

    it('can be found', function(done) {
        db.Task.findById(task.id)
            .then(function(foundTask) {
                expect(foundTask instanceof db.Task).toBe(true, 'found the created task');
                expect(foundTask.type).toBe('HaveYouBeenHereRecently', 'correct type');
                expect(foundTask.personId).toBe(1, 'got correct person');
                expect(foundTask.locationId).toBe(6, 'got correct location');
                expect(foundTask.outcome).toEqual({
                    beenHere: 'yes'
                }, 'outcome');
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

h.describe('Task model.', function() {
    it('method hasPersonBeenAtLocation.', function() {
        expect(typeof db.Task.hasPersonBeenAtLocation).toBe('function', 'method exists');
    });
});
