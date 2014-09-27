/**
 * Mongoose models for Missions. There is a base Mission model
 * that is not used directly and one discriminator for every
 * mission type.
 */

'use strict';

var util = require('util');
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../constants');

require('./Product');
require('./Person');
var Person = mongoose.model('Person');

/**
 * Map of mission types to the number of points it gives
 * @type {{}}
 */
var POINTS_BY_TYPE = {
    AddLocationMission:  10, // TODO; make sure one cannot submit this mission explicitly
    VisitBonusMission:  100, // TODO: make sure visitBonus is not claimed when it wasn't available
    HasOptionsMission:   10,
    WantVeganMission:    10,
    WhatOptionsMission:  10,
    BuyOptionsMission:   20,
    RateOptionsMission:  10,
    GiveFeedbackMission: 20,
    OfferQualityMission: 10,
    EffortValueMission:  10
};

/**
 * Constructs a new mission schema
 * @param outcomeType Mongoose type description for the outcome
 * @constructor
 */
var MissionSchema = function(outcomeType) {
    // Prepare the points schema
    var points = {};
    _.each(constants.TEAMS, function(team) {
        points[team] = {
            type: Number
        };
    });

    // Create the base schema
    Schema.call(this, {
        person: {type: Schema.Types.ObjectId, ref: 'Person', required: true},
        location: {type: Schema.Types.ObjectId, ref: 'Location', required: true},
        points: points,
        completed: {type: Date}
    });

    // Add the outcome (unless we're in the base schema, which doesn't have it)
    if (typeof outcomeType !== 'undefined') {
        if (_.isPlainObject(outcomeType) === false) {
            outcomeType = { type: outcomeType };
        }
        _.assign(outcomeType, { required: true });
        this.add({
            outcome: outcomeType
        });
    }
};
util.inherits(MissionSchema, Schema);

var missionSchema = new MissionSchema();
missionSchema.pre('save', function(next) {
    var that = this;
    var missionType = that.getType();

    // Validate points
    Person.findById(that.person, function(err, person) {
        if (err) {
            return next(err);
        }

        if (Object.keys(that.points.toObject()).length === 0) {
            // If no points are defined, set the maximum for the given person
            that.points = {};
            that.points[person.team] = POINTS_BY_TYPE[missionType];
        }
        else if (typeof that.points !== 'object') {
            return next(new Error('Mission points must be an object, but found: ' + that.points));
        }
        else {
            // If points are defined, make sure they are valid
            _.forOwn(that.points.toObject(), function(p, t) {
                if (p < 0 || p > POINTS_BY_TYPE[missionType] || p !== Math.round(p)) {
                    return next(new Error('Invalid points for ' + missionType + ': ' + p));
                }
                if (p > 0 && t !== person.team) {
                    return next(new Error('Mission points attributed to wrong team: ' + t + ' instead of ' + person.team));
                }
            });
        }

        if (!that.isNew) {
            return next();
        }

        // Populate the location to notify it of the new mission
        // TODO: should only populate if not already done?
        that.populate('location', function(err) {
            if (err) {
                return next(err);
            }
            return that.location.notifyMissionCompleted(that, next);
        });
    });
});

/**
 * Returns the type of the mission
 * @returns {string}
 */
missionSchema.methods.getType = function() {
    return this.constructor.modelName;
};

/**
 * Returns the identifier of this mission used by the frontend
 * @returns {string}
 */
missionSchema.methods.getIdentifier = function() {
    var type = this.getType();
    return type.charAt(0).toLowerCase() + type.substr(
        1, type.length - 1 - 'Mission'.length
    );
};

/**
 * Returns this mission ready to be sent to the frontend
 * @returns {{}}
 * TODO: this should be toJSON instead, it's called automatically
 */
missionSchema.methods.toApiObject = function() {
    // TODO: how to handle the different outcomes: need to sanitize them
    return _.assign(
        _.pick(this, ['id', 'completed', 'outcome', 'points']),
        {
            // Expose only the person and location id
            // (need this because it could be populated or not)
            person: this.person._id || this.person,
            location: this.location._id || this.location,
            type: this.getIdentifier()
        }
    );
};

// Create Mission model
var Mission = mongoose.model('Mission', missionSchema);

// Object to hold all the missions that will be exported
var allMissions = {};

// And all the discriminators (= specific missions)
allMissions.AddLocationMission = Mission.discriminator('AddLocationMission', new MissionSchema(
    Boolean
));


allMissions.VisitBonusMission = Mission.discriminator('VisitBonusMission', new MissionSchema(
    Boolean
));

allMissions.HasOptionsMission = Mission.discriminator('HasOptionsMission', new MissionSchema(
    {
        type: String,
        enum: ['no', 'ratherNo', 'noClue', 'ratherYes', 'yes']
    }
));

allMissions.WantVeganMission = Mission.discriminator('WantVeganMission', new MissionSchema(
    [{
        expression: {
            type: String,
            required: true
        },
        expressionType: {
            type: String,
            required: true,
            enum: ['builtin', 'custom']
        }
    }]
));

allMissions.WhatOptionsMission = Mission.discriminator('WhatOptionsMission', new MissionSchema(
    [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        info: {
            type: String,
            required: true,
            enum: ['unavailable', 'temporarilyUnavailable', 'available']
        }
    }]
));

allMissions.BuyOptionsMission = Mission.discriminator('BuyOptionsMission', new MissionSchema(
    [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
    }]
));

allMissions.RateOptionsMission = Mission.discriminator('RateOptionsMission', new MissionSchema(
    [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        info: {
            type: Number,
            min: 1.0,
            max: 5.0,
            required: true
        }
    }]
));

allMissions.GiveFeedbackMission = Mission.discriminator('GiveFeedbackMission', new MissionSchema(
    String
));

allMissions.OfferQualityMission = Mission.discriminator('OfferQualityMission', new MissionSchema(
    {
        type: Number,
        min: 1.0,
        max: 5.0
    }
));

allMissions.EffortValueMission = Mission.discriminator('EffortValueMission', new MissionSchema(
    {
        type: String,
        enum: ['no', 'yes']
    }
));

// TODO: where should this helper methods go?
/**
 * Returns the mission model with the given identifier
 * (used by the frontend)
 *
 * @param {string} identifier
 * @returns {Mission}
 */
allMissions.getModelForIdentifier = function(identifier) {
    var MissionModel;
    if (typeof identifier === 'string' && identifier.length > 0) {
        var name = identifier.charAt(0).toUpperCase() +
            identifier.substr(1) + 'Mission';
        MissionModel = allMissions[name];
    }
    return MissionModel;
};

/**
 * Returns whether the given mission model is a mission
 * that acts on Products
 * @param {Mission} MissionModel
 * @returns {boolean}
 */
allMissions.isProductMission = function(MissionModel) {
    return (
        MissionModel === allMissions.WhatOptionsMission ||
        MissionModel === allMissions.BuyOptionsMission ||
        MissionModel === allMissions.RateOptionsMission
    );
};

module.exports = allMissions;
