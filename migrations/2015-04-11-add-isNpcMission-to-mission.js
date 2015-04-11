/* global db */
/**
 * Migration script to add isNpcMission=false (the default value)
 * to all existing missions
 */
db.missions.find().forEach(function(mission) {
    'use strict';

    try {
        db.missions.update(
            {_id: mission._id},
            {
                $set: {
                    isNpcMission: false
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
