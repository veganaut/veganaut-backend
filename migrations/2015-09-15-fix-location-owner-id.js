/* global db, print, ObjectId */
/**
 * Fix all location owner ids that are strings instead of ObjectIds
 * This happened due to a bug in the remove-tem-add-owner migration.
 */

db.locations.find().forEach(function(location) {
    'use strict';
    if (typeof location.owner === 'string') {
        try {
            db.locations.update(
                {_id: location._id},
                {
                    $set: {
                        owner: new ObjectId(location.owner)
                    }
                }
            );
        }
        catch (e) {
            print(e);
        }
    }
});
