/**
 * Mongoose schema for a location.
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Visit');
var Visit = mongoose.model('Visit');

/**
 * Time in ms between two visits that give a visit bonus: 3 weeks
 * TODO: This should go in a global config file somewhere
 * @type {number}
 */
var TIME_BETWEEN_TWO_VISIT_BONUS =  3 * 7 * 24 * 60 * 60 * 1000;

/**
 * Constants related to point computation
 */

// How much points decrease [unit: factor per millisecond]. Currently 10% per day.
var POINTS_DECREASE_FACTOR = Math.pow(0.90, 1.0 / (24*60*60*1000));

// Maximal available points for a location
var MAX_AVAILABLE_POINTS = 500;

// How much available points increase over time. Currently 10 per hour.
var AVAILABLE_POINTS_INCREASE_RATE = 10.0 / (60*60*1000);

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

/**
 * Calculates when the given person is next allowed to do the visitBonus mission
 * at this location.
 * @param {Person} person
 * @param {function} next
 */
locationSchema.methods.computeNextVisitBonusDate = function(person, next) {
    var that = this;
    Visit.findOne({
        location: this.id,
        person: person.id,
        missions: {
            $elemMatch: { type: 'visitBonus' }
        }
    })
        .sort({ completed: 'desc' })
        .exec(function(err, visit) {
            if (err) { return next(err); }
            that._nextVisitBonusDate = that._nextVisitBonusDate || {};
            if (!visit) {
                // If there is no recent visit, one can get the bonus right now
                that._nextVisitBonusDate[person.id] = new Date();
            }
            else {
                // Some time after the last visitBonus, you get a new visit bonus
                that._nextVisitBonusDate[person.id] = new Date(visit.completed.getTime() + TIME_BETWEEN_TWO_VISIT_BONUS);
            }
            return next();
        }
    );
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
    _.each(['green', 'blue'], function(team) {
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
 * Callback to notify the location that a new visit has been created. The
 * notification will then update its score.
 */
locationSchema.methods.notifyVisitCreated = function(visit, next) {
    // Update the score of the location
    var points = this.computeCurrentPoints();
    var availablePoints = this.computeCurrentAvailablePoints();
    var team = this.team;
    var teamPoints = points[team] || -1;

    _.each(visit.missions, function(mission) {
        _.forOwn(mission.points, function(p, t) {
            points[t] += p;
            availablePoints -= p;
        });
    });
    availablePoints = Math.max(availablePoints, 0);

    _.forOwn(points, function(p, t) {
        if (p > teamPoints) {
            team = t;
            teamPoints = p;
        }
    });

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

    // Add nextVisitBonusDate if it's available
    if (typeof person !== 'undefined' &&
        typeof this._nextVisitBonusDate !== 'undefined' &&
        typeof this._nextVisitBonusDate[person.id] !== 'undefined')
    {
        apiObj.nextVisitBonusDate = this._nextVisitBonusDate[person.id];
    }

    return apiObj;
};


mongoose.model('Location', locationSchema);
