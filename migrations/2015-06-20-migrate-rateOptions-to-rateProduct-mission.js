/* global db */
/**
 * Migrations script to remove the "info" field from all whatOptions mission
 * outcomes.
 */
db.missions.find({__t: 'RateOptionsMission'}).forEach(function(mission) {
    'use strict';

    // Go through all the outcomes and create individual missions for each
    mission.outcome.forEach(function(outcome, i) {
        try {
            if (i === 0) {
                // For the first outcome, we just update the existing mission
                db.missions.update(
                    {_id: mission._id},
                    {
                        $set: {
                            __t: 'RateProductMission',
                            outcome: outcome
                        }
                    }
                );
            }
            else {
                // For all outcomes after the first, we have to create a new mission
                var newMission = {
                    __t: 'RateProductMission',
                    __v: 0,
                    isFirstOfType: false, // The i === 0 is the only one that can be firstOfType
                    completed: mission.completed,
                    isNpcMission: mission.isNpcMission,
                    location: mission.location,
                    person: mission.person,
                    points: mission.points,
                    outcome: outcome
                };
                db.missions.insert(newMission);
            }
        }
        catch (e) {
            print(e);
        }
    });

});
