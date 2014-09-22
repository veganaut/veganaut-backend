/**
 * Mongoose schema for a mission.
 * This is used as a sub-schema in Visit and not as an independent model
 */

'use strict';

var _ = require('lodash');
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
    'wantVegan',
    'whatOptions',
    'buyOptions',
    'giveFeedback',
    'rateOptions',
    'offerQuality',
    'effortValue'
];

/**
 * Map of mission types to the number of points it gives
 * @type {{}}
 */
var POINTS_BY_TYPE = {
    addLocation:  10,
    visitBonus:  100, // TODO: make sure visitBonus is not claimed when it wasn't available
    hasOptions:   10,
    wantVegan:    10,
    whatOptions:  10,
    buyOptions:   20,
    giveFeedback: 20,
    rateOptions:  10,
    offerQuality: 10,
    effortValue:  10
};

var missionSchema = new Schema({
    type: { type: String, enum: MISSION_TYPES, required: true },
    outcome: { type: Schema.Types.Mixed, required: true },
    points: { type: Schema.Types.Mixed }
});

missionSchema.pre('save', function(next) {
    var mission = this;
    var visit = mission.parent();

    // validate points
    // FIXME: Test that this indeed catches errors. Jonas suspects it might not really work.
    Person.findById(visit.person, function(err, person) {
        if (err) { return next(err); }

        if (typeof mission.points === 'undefined') {
            // If no points are defined, set the maximum for the given person
            mission.points = {};
            mission.points[person.team] = POINTS_BY_TYPE[mission.type];
        }
        else if (typeof mission.points !== 'object') {
            return next(new Error('Mission points must be an object, but found: ' + mission.points));
        }
        else {
            // If points are defined, make sure they are valid
            _.forOwn(mission.points, function(p, t) {
                if (p < 0 || p > POINTS_BY_TYPE[mission.type] || p !== Math.round(p)) {
                    return next(new Error('Invalid points for mission of type ' + mission.type + ': ' + p));
                }
                if (t !== person.team) {
                    return next(new Error('Mission points attributed to wrong team: ' + t + ' instead of ' + person.team));
                }
            });
        }

        return next();
    });
});

module.exports = missionSchema;
