/* global db */
db.locations.find().forEach(function(location) {
    'use strict';
    var effort = {
        total: 0,
        rank: 0,
        count: 0
    };
    var EFFORT_VALUES = {
        yes: 1.0,
        ratherYes: 0.5,
        ratherNo: -0.5,
        no: -1.0
    };
    db.missions.find({
        __t: 'EffortValueMission',
        location: location._id
    }).forEach(function(mission) {
        effort.count += 1;
        effort.total = effort.total + EFFORT_VALUES[mission.outcome];
    });

    // Set the correct rank
    effort.rank = (effort.total + 0 * 2) / (effort.count + 2);

    try {
        db.locations.update(
            {_id: location._id},
            {$set: {efforts: effort}}
        );
    }
    catch (e) {
        print(e);
    }

});
