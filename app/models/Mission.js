/**
 * Mongoose schema for a mission.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Person');
var Person = mongoose.model('Person');

/**
 * All the available mission types
 * @type {string[]}
 */
var MISSION_TYPES = [
    'addLocation',
    'visitBonus',
    'hasOptions',
    'whatOptions',
    'buyOptions',
    'giveFeedback',
    'rateOptions'
];

/**
 * Map of mission types to the number of points it gives
 * @type {{}}
 */
var POINTS_BY_TYPE = {
    addLocation:  10,
    visitBonus:  100, // TODO: make sure visitBonus is not claimed when it wasn't available
    hasOptions:   10,
    whatOptions:  10,
    buyOptions:   20,
    giveFeedback: 20,
    rateOptions:  10
};

var MissionSchema = new Schema({
    type: { type: String, enum: MISSION_TYPES, required: true },
    outcome: { type: Schema.Types.Mixed, required: true },
    points: { type: Schema.Types.Mixed }
});

MissionSchema.pre('save', function(next) {
    var mission = this;

    if (typeof mission.points === 'undefined') {
        var visit = mission.parent();
        Person.findById(visit.person, function(err, person) {
            mission.points = {};
            mission.points[person.team] = POINTS_BY_TYPE[mission.type];
            next(err);
        });
    }
    else {
        return next();
    }
});

mongoose.model('Mission', MissionSchema);
