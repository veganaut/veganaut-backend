/* global db */
/**
 * Migration script to add the rank property to the averages (quality, efforts)
 * of the location model.
 */

db.locations.find().forEach(function(location) {
    'use strict';

    var effortsRank = 0;
    var qualityRank = 0;
    if (location.efforts.count > 0) {
        effortsRank = (location.efforts.total + 0 * 2) / (location.efforts.count + 2);
    }
    if (location.quality.count > 0) {
        qualityRank = (location.quality.total + 3 * 2) / (location.quality.count + 2);
    }

    try {
        db.locations.update(
            {_id: location._id},
            {
                $set: {
                    'efforts.rank': effortsRank,
                    'quality.rank': qualityRank
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
