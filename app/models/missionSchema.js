/**
 * Mongoose schema for a mission.
 * This is used as a sub-schema in Visit and not as an independent model
 */

'use strict';

var util = require('util');
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Product');
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
    'rateOptions',
    'giveFeedback',
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
    rateOptions:  10,
    giveFeedback: 20,
    offerQuality: 10,
    effortValue:  10
};

// Define a Mission Schema constructor
var MissionSchema = function(outcomeDefinition) {
    Schema.call(this, {
        type: { type: String, enum: MISSION_TYPES, required: true },
        points: { type: Schema.Types.Mixed }
    });

    if (typeof outcomeDefinition !== 'undefined') {
        this.add({
            outcome: outcomeDefinition
        });
    }
};
util.inherits(MissionSchema, Schema);

var missionSchema = new MissionSchema({ type: Schema.Types.Mixed, required: true }); // TODO: this should be removed once the new system works
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

// Create Mission model
var Mission = mongoose.model('Mission', missionSchema);

// And all the discriminators (= specific missions)
Mission.discriminator('AddLocationMission', new MissionSchema({
    type: Boolean
}));

Mission.discriminator('VisitBonusMission', new MissionSchema({
    type: Boolean
}));

Mission.discriminator('HasOptionsMission', new MissionSchema({
    type: String // TODO: what type?
}));

Mission.discriminator('WantVeganMission', new MissionSchema({
    type: {
        expressions: [{
            type: String,
            required: true
        }],
        others: [{
            type: String,
            required: true
        }]
    }
}));

Mission.discriminator('WhatOptionsMission',  new MissionSchema({
    type: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        info: {
            type: String,
            required: true
        }
    }]
}));

Mission.discriminator('BuyOptionsMission', new MissionSchema({
    type: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        info: { // TODO: is this needed?
            type: String,
            required: true
        }
    }]
}));

Mission.discriminator('RateOptionsMission', new MissionSchema({
    type: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        info: {
            type: Number,
            required: true
        }
    }]
}));

Mission.discriminator('GiveFeedbackMission', new MissionSchema({
    type: {
        feedback: {
            type: String,
            required: true
        },
        didNotDoIt: {
            type: Boolean,
            required: true
        }
    }
}));

Mission.discriminator('OfferQualityMission', new MissionSchema({
    type: Number
}));

Mission.discriminator('EffortValueMission', new MissionSchema({
    type: Number
}));

module.exports = missionSchema;
