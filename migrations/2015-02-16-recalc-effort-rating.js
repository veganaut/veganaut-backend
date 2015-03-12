/* global db */
db.locations.find().forEach(function(location) {
    'use strict';
    var total = 0;
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
        print(mission.outcome);
        total = total + EFFORT_VALUES[mission.outcome];
    });

    try {
        db.locations.update(
            {_id: location._id},
            {$set: {'efforts.total': total}}
        );
    }
    catch (e) {
        print(e);
    }

});