/**
 * Mongoose schema for a mission.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Person');
var Person = mongoose.model('Person');

var MISSION_TYPES = [
    'visitBonus',
    'hasOptions',
    'whatOptions',
    'buyOptions',
    'giveFeedback',
    'rateOptions'
];

var MissionSchema = new Schema({
    type: { type: String, enum: MISSION_TYPES, required: true },
    outcome: { type: Schema.Types.Mixed, required: true },
    points: { type: Schema.Types.Mixed },
});

MissionSchema.pre('save', function(next) {
    var mission = this;

    if (typeof mission.points === 'undefined') {
        var visit = mission.parent();
        Person.findById(visit.person, function(err, person) {
            mission.points = {};
            mission.points[person.team] = 3;
            next(err);
        });
    }
    else {
        return next();
    }
});

mongoose.model('Mission', MissionSchema);
