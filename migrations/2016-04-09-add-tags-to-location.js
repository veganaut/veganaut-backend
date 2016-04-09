/* global db, print */
/**
 * Migration script to add tags={} to all existing locations
 */
db.locations.find().forEach(function(location) {
    'use strict';

    try {
        db.locations.update(
            {_id: location._id},
            {
                $set: {
                    tags: {}
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
