/**
 * Mongoose schema for a location.
 */

'use strict';

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

// Maximal available points for a location
var MAX_AVAILABLE_POINTS = 500;

// How much available points increase over time. Currently 10 per hour.
var AVAILABLE_POINTS_INCREASE_RATE = 10.0 / (60*60*1000);

// Numeric values for various effort ratings
var EFFORT_VALUES = {
    yes: 1.0,
    no: -1.0
};

var locationSchema = new Schema({
    coordinates: {type: [Number], index: '2d'},
    name: String,
    type: {type: String, enum: ['gastronomy', 'retail']},

    // Maps team names to their points at time updatedAt.
    points: {type: Schema.Types.Mixed, default: {}},

    // The team that last conquered this place. Used to break ties if teams
    // have the same number of points.
    team: String,

    // Points that are available at this location, at time updatedAt.
    availablePoints: {type: Number, default: AVAILABLE_POINTS_INCREASE_RATE * 24*60*60*1000},
    updatedAt: {type: Date, default: Date.now}
});

// Locations keep track of average quality and effort
new Average('quality', locationSchema);
new Average('effort', locationSchema);


/**
 * Loads the last time the person completed a mission of every type.
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
            mapped[Missions.getIdentifierForModelName(result._id)] = result.date;
        });

        // Save the dates
        that._lastMissionDates = that._lastMissionDates || {};
        that._lastMissionDates[person.id] = mapped;
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
    _.each(constants.TEAMS, function(team) {
        that.points[team] = that.points[team] || 0;
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
 * Computes the available points for this location as of now.
 */
locationSchema.methods.computeCurrentAvailablePoints = function() {
    var elapsed = Date.now() - this.updatedAt.getTime();

    // Available points increase linearly.
    var available = this.availablePoints + elapsed * AVAILABLE_POINTS_INCREASE_RATE;
    available = Math.min(available, MAX_AVAILABLE_POINTS);
    available = Math.round(available);

    return available;
};

/**
 * Callback to notify the location that a new mission has been completed. The
 * location will then update its score.
 */
locationSchema.methods.notifyMissionCompleted = function(mission, next) {
    // Update the score of the location
    var points = this.computeCurrentPoints();
    var availablePoints = this.computeCurrentAvailablePoints();
    var team = this.team;
    var teamPoints = points[team] || -1;

    // Add up all the new points and decrease the availablePoints
    _.forOwn(mission.points.toObject(), function(p, t) {
        points[t] += Math.min(p, availablePoints);
        availablePoints -= Math.min(p, availablePoints);
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
    this.availablePoints = availablePoints;
    this.team = team;
    this.updatedAt = Date.now();
    this.save(next);
};

/**
 * Returns this location ready to be sent to the frontend
 * @param {Person} [person]
 * @returns {{}}
 * TODO: this should be toJSON instead, it's called automatically (although we have an argument here...)
 */
locationSchema.methods.toApiObject = function (person) {
    var apiObj = _.pick(this, ['name', 'type', 'id', 'team', 'availablePoints']);

    // Add lat/lng in the format the frontend expects
    apiObj.lat = this.coordinates[0];
    apiObj.lng = this.coordinates[1];

    // Compute points as of now
    apiObj.points = this.computeCurrentPoints();

    // Compute availablePoints as of now
    apiObj.availablePoints = this.computeCurrentAvailablePoints();

    // Add the quality
    apiObj.quality = this.quality.average;

    // Add nextVisitBonusDate if it's available
    if (typeof person !== 'undefined' &&
        typeof this._lastMissionDates !== 'undefined' &&
        typeof this._lastMissionDates[person.id] !== 'undefined')
    {
        apiObj.lastMissionDates = this._lastMissionDates[person.id];
    }

    return apiObj;
};


mongoose.model('Location', locationSchema);
