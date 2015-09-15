/* global db, print */
/**
 * Migrations script to remove the "info" field from all whatOptions mission
 * outcomes.
 */
db.missions.find({__t: 'WhatOptionsMission'}).forEach(function(mission) {
    'use strict';

    // Remove info from all outcomes
    var newOutcome = mission.outcome;
    newOutcome.forEach(function(productInfo) {
        delete productInfo.info;
    });

    try {
        db.missions.update(
            {_id: mission._id},
            {
                $set: {
                    outcome: newOutcome
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
