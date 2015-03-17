/* global db */
/**
 * Migration script to swap the coordinates of a location.
 * It was initially stored as [lat, lng], but should be stored as [lng, lat].
 */

db.locations.find().forEach(function(location) {
    'use strict';

    try {
        db.locations.update(
            {_id: location._id},
            {
                $set: {
                    'coordinates': [location.coordinates[1], location.coordinates[0]]
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
