/* global db, print */
/**
 * Migration script to add createdAt timestamp to people.
 * As a vast simplification, just sets all the timestamps
 * to the first of January 2015.
 */

var createdAt = new Date(Date.UTC(2015, 0, 1, 12, 0));
db.people.find().forEach(function(person) {
    'use strict';
    if (typeof person.createdAt === 'undefined') {
        try {
            db.people.update(
                {_id: person._id},
                {$set: {createdAt: createdAt}}
            );
        }
        catch (e) {
            print(e);
        }
    }
});
