/* global db */
/**
 * Migration script to remove teams and change location ownership to be
 * person-based instead of team-based.
 *
 * The following changes are applied:
 *
 * Mission model :
 * - update points to be a simple number
 *
 * Person model:
 * - remove team
 * - add accountType
 *
 * Location model:
 * - remove team
 * - add owner
 * - update points to be a map of user id to points
 */


// Update the missions
// This is done first so the location update already sees the simplified points.
db.missions.find().forEach(function(mission) {
    'use strict';

    var points = 0;
    if (mission.points !== null) {
        for (var team in mission.points) {
            if (mission.points.hasOwnProperty(team)) {
                points = mission.points[team];
                break; // Should never have more than one entry anyway
            }
        }
    }

    try {
        db.missions.update(
            {_id: mission._id},
            {
                $set: {
                    points: points
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});

// Update the people
db.people.find().forEach(function(person) {
    'use strict';
    var accountType = person.team === 'npc' ? 'npc' : 'player';
    try {
        db.people.update(
            {_id: person._id},
            {
                $set: {
                    accountType: accountType
                },
                $unset: {
                    team: ''
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});

// Update the locations
var POINTS_DECREASE_FACTOR = Math.pow(0.90, 1.0 / (24 * 60 * 60 * 1000)); // Taken from Location model
db.locations.find().forEach(function(location) {
    'use strict';
    var points = {};
    var ownerId;

    // Get the time stamp when this location was last updated
    var updatedAtTime = location.updatedAt.getTime();

    // Find all the missions done at this location to calculate the points and the owner
    db.missions
        .find({
            location: location._id
        })
        .sort({
            // Get the newest mission first
            completed: -1
        })
        .forEach(function(mission) {
            // Get the id of the person of this mission
            var missionPersonId = mission.person.str;

            // If no owner has been set yet, set the person of this mission as owner
            if (typeof ownerId === 'undefined') {
                ownerId = missionPersonId;
            }

            // Calculate how many points are left at the updatedAt time
            var elapsed = updatedAtTime - mission.completed.getTime();
            var remainingPoints = Math.round(mission.points * Math.pow(POINTS_DECREASE_FACTOR, elapsed));
            if (remainingPoints > 0) {
                // Add to the points this person already has
                points[missionPersonId] = points[missionPersonId] || 0;
                points[missionPersonId] += remainingPoints;

                // Check if this mission's person has more points now than the owner
                if ((points[missionPersonId] || 0) > (points[ownerId] || 0)) {
                    ownerId = missionPersonId;
                }
            }
        })
    ;

    // Check if we have an owner
    if (typeof ownerId === 'undefined') {
        // Some places don't seem to have any mission at all. This should never
        // have happened, but it did. So we use an admin account as the owner.
        ownerId = '552ab1d2ac52785774199dac';
        print('Using admin owner because no mission found for location', location.name);
    }

    try {
        db.locations.update(
            {_id: location._id},
            {
                $set: {
                    owner: ownerId,
                    points: points
                },
                $unset: {
                    team: ''
                }
            }
        );
    }
    catch (e) {
        print(e);
    }
});
