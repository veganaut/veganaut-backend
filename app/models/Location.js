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
 * Loads the last time the person completed a mission of every type.
 * This is stored in a private variable. If this method is called
 * multiple times with different people, only the mission dates
 * for the last person are stored.
 * @param {Person} person
 * @param {function} next
 */
locationSchema.methods.computeLastMissionDates = function(person, next) {
    var that = this;
    // Load the most recent mission of every type
    Missions.Mission.aggregate([
        // TODO: add $match to only get missions at most as old as the longest mission cool down period
        { $match: {
            location: this._id,
            person: person._id
        }},
        { $group: {
            _id: '$__t',
            date: { $max: '$completed' }
        }}
    ]).exec(function(err, results) {
        if (err) {
            return next(err);
        }

        // Map the results as mission identifier to last date
        var mapped = {};
        _.each(results, function(result) {
            mapped[Missions[result._id].getIdentifier()] = result.date;
        });

        // Save the dates
        that._lastMissionDates = mapped;
        return next();
    });
};

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

        // Add lastMissionDates if they are available
        if (typeof doc._lastMissionDates !== 'undefined') {
            ret.lastMissionDates = doc._lastMissionDates;
        }

        return ret;
    }
};


mongoose.model('Location', locationSchema);
