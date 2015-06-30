/**
 * Mongoose schema for a location.
 */

'use strict';

var util = require('util');
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../utils/constants');
var Average = require('../utils/Average');
var Missions = require('./Missions');

/*
 * Constants related to point computation
 */
// How much points decrease [unit: factor per millisecond]. Currently 10% per day.
var POINTS_DECREASE_FACTOR = Math.pow(0.90, 1.0 / (24*60*60*1000));

// Numeric values for various effort ratings
var EFFORT_VALUES = {
    yes: 1.0,
    ratherYes: 0.5,
    ratherNo: -0.5,
    no: -1.0
};

// Maximum longitude over which one can get the locations by bounding box
var BOUNDING_BOX_MAX_LNG = 180;

var locationSchema = new Schema({
    coordinates: {type: [Number], index: '2d'},
    name: String,
    description: String,
    link: String,
    type: {type: String, enum: ['gastronomy', 'retail']},

    // Maps team names to their points at time updatedAt.
    points: {type: Schema.Types.Mixed, default: {}},

    // The team that last conquered this place. Used to break ties if teams
    // have the same number of points.
    team: {type: String, enum: constants.ALL_TEAMS, default: constants.NPC_TEAM},

    // When the points were last calculated and stored
    updatedAt: {type: Date, default: Date.now}
});

// Locations keep track of average quality and effort
new Average('quality', 1, 5, locationSchema);
new Average('effort', -1, 1, locationSchema);


/**
 * Computes the points for this location as of now.
 * Points are stored in the database as of time updatedAt; whenever we need the
 * current score, we need to compute the changes since then.
 */
locationSchema.methods.computeCurrentPoints = function() {
    var that = this;
    var points = {};
    var elapsed = Date.now() - this.updatedAt.getTime();

    // Ensure the result contains points for every team
    _.each(constants.PLAYER_TEAMS, function(team) {
        points[team] = 0;
    });

    // Points for each team diminish exponentially
    // TODO: exponential decrease gets too slow after some time... we should
    // have a minimal rate of decrease.
    _.forOwn(that.points, function(teamPoints, team) {
        points[team] = Math.round(teamPoints * Math.pow(POINTS_DECREASE_FACTOR, elapsed));
    });

    return points;
};

/**
 * Callback to notify the location that a new mission has been completed. The
 * location will then update its score.
 */
locationSchema.methods.notifyMissionCompleted = function(mission, next) {
    // Update the score of the location
    var points = this.computeCurrentPoints();
    var team = this.team;
    var teamPoints = points[team] || 0;

    // Add up all the new points
    _.forOwn(mission.points.toObject(), function(p, t) {
        points[t] += p;
    });

    // Check if a new team has the most points
    _.forOwn(points, function(p, t) {
        // Only if you make more points, do you get to be the new owner
        if (p > teamPoints) {
            team = t;
            teamPoints = p;
        }
    });

    // For offerQuality missions, the average quality changes
    if (mission instanceof Missions.OfferQualityMission) {
        this.addQuality(mission.outcome);
    }

    // For effortValue missions, the average effort changes
    if (mission instanceof Missions.EffortValueMission) {
        this.addEffort(EFFORT_VALUES[mission.outcome]);
    }

    // Save the new state
    this.points = points;
    this.markModified('points');
    this.team = team;
    this.updatedAt = Date.now();
    this.save(next);
};

/**
 * toJSON transform method is automatically called when converting a location
 * to JSON (as before sending it over the API)
 * @type {{transform: Function}}
 */
locationSchema.options.toJSON = {
    transform: function(doc) {
        var ret = _.pick(doc, ['name', 'description', 'link', 'type', 'id', 'team', 'updatedAt']);

        // Add lat/lng in the format the frontend expects
        if (util.isArray(doc.coordinates)) {
            ret.lng = doc.coordinates[0];
            ret.lat = doc.coordinates[1];
        }

        // Compute and include points if the are present (= were loaded from db)
        if (typeof doc.points !== 'undefined') {
            ret.points = doc.computeCurrentPoints();
        }

        // Add the quality and effort
        ret.quality = {
            average: doc.quality.average,
            numRatings: doc.quality.count
        };
        ret.effort = {
            average: doc.efforts.average,
            numRatings: doc.efforts.count
        };

        return ret;
    }
};

/**
 * Returns the filter to use on 'coordinates' to limit results by a bounding box.
 * Will throw an error if the given bounds are invalid, but not if no bounds are given.
 * @param {string} [boundingBoxString] In the format 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
 * @returns {{}|undefined}
 */
locationSchema.statics.getBoundingBoxQuery = function(boundingBoxString) {
    var query;
    if (typeof boundingBoxString === 'string') {
        var bounds = boundingBoxString.split(',');

        // Checks if every item is a valid number
        var invalidBounds = false;
        bounds = _.map(bounds, function(x) {
            var b = parseFloat(x);
            if (isNaN(b)) {
                invalidBounds = true;
            }
            return b;
        });

        if (invalidBounds) {
            throw new Error('Bounds are invalid');
        }

        // Only set the coordinates if the bounding box is not too big
        if (Math.abs(bounds[2] - bounds[0]) < BOUNDING_BOX_MAX_LNG) {
            var box = [
                [bounds[0], bounds[1]],
                [bounds[2], bounds[3]]
            ];
            query = {
                $within: {$box: box}
            };
        }
    }

    return query;
};


mongoose.model('Location', locationSchema);
