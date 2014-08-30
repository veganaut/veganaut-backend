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

var locationSchema = new Schema({
    coordinates: {type: [Number], index: '2d'},
    name: String,
    type: {type: String, enum: ['gastronomy', 'retail']},
    previousOwnerStart: {
        type: Date,
        default: function() {
            return new Date();
        }
    },
    currentOwnerStart: {
        type: Date,
        default: function() {
            return new Date();
        }
    }
});

/**
 * Retrieves the visits at this location since the previousOwnerStart
 * @param {function} next
 */
locationSchema.methods.populateRecentVisits = function(next) {
    var that = this;
    Visit.find({ location: this.id,  completed: { $gte: that.previousOwnerStart } })
        .exec(function(err, visits) {
            if (err) { return next(err); }
            that._recentVisits = visits;
            return next();
        })
    ;
};

/**
 * Calculates when the given person is next allowed to do the visitBonus mission
 * at this location.
 * @param {Person} person
 * @param {function} next
 */
locationSchema.methods.calculateNextVisitBonusDate = function(person, next) {
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

// TODO: move this to a helper somewhere (it's also used in models/Visit.js
var addPoints = function() {
    var totalPoints = {};
    _.forEach(arguments, function(arg) {
        _.forOwn(arg, function(points, team) {
            totalPoints[team] = totalPoints[team] || 0;
            totalPoints[team] += points;
        });
    });
    return totalPoints;
};

/**
 * Calculates the points of each team on this location.
 * Stores it on the location object itself.
 */
locationSchema.methods.calculatePoints = function() {
    // TODO: this needs more specific tests
    if (typeof(this._recentVisits) === 'undefined') {
        throw 'Must call populateRecentVisits before calling calculateScores';
    }

    var that = this;
    that._totalPoints = {};
    _.each(this._recentVisits, function(visit) {
        that._totalPoints = addPoints(that._totalPoints, visit.getTotalPoints());
    });

    var bestPoints = 0;
    _.each(that._totalPoints, function(points, team) {
        // TODO: handle equal points correctly (team that had it for longer keeps it)
        if (points > bestPoints) {
            bestPoints = points;
            that._bestTeam = team;
        }
    });
};

/**
 * Makes the necessary operations (updating timestamps) when the owner
 * of this location change through the given Visit
 * @param {Visit} visit
 */
locationSchema.methods.performOwnerChange = function(visit) {
    this.previousOwnerStart = this.currentOwnerStart;
    this.currentOwnerStart = visit.completed;
};

/**
 * Returns this location ready to be sent to the frontend
 * @param {Person} [person]
 * @returns {{}}
 */
locationSchema.methods.toApiObject = function (person) {
    var apiObj = _.pick(this, ['name', 'coordinates', 'type', 'id', 'currentOwnerStart']);

    // Add points information if it's available
    if (typeof this._bestTeam !== 'undefined') {
        apiObj.team = this._bestTeam;
        apiObj.points = this._totalPoints;
    }

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
