/**
 * Mongoose schema for a location.
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Visit');
var Visit = mongoose.model('Visit');

var LocationSchema = new Schema({
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


LocationSchema.methods.populateRecentVisits = function(next) {
    var that = this;
    Visit.find({ location: this.id,  completed: { $gte: that.previousOwnerStart } })
//        .populate('missions') // TODO: this should be needed, but it isn't. Probably wrong schema definition
        .exec(function(err, visits) {
            if (err) { return next(err); }
            that._recentVisits = visits;
            return next();
        })
    ;
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
LocationSchema.methods.calculatePoints = function() {
    // TODO: this needs more specific tests
    if (typeof(this._recentVisits) === 'undefined') {
        throw 'Must call populateRecentVisits before calling calculateScores';
    }

    var that = this;
    that._totalPoints = {};
    _.each(this._recentVisits, function(visit) {
        that._totalPoints = addPoints(that._totalPoints, visit.getTotalPoints());
    });

    that._bestTeam = undefined;
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
 * Returns this location ready to be sent to the frontend
 * @returns {{}}
 */
LocationSchema.methods.toApiObject = function () {
    var apiObj = _.pick(this, ['name', 'coordinates', 'type', 'id', 'currentOwnerStart']);

    // Add points information if it's available
    if (typeof this._bestTeam !== 'undefined') {
        apiObj.team = this._bestTeam;
        apiObj.points = this._totalPoints;
    }

    return apiObj;
};


mongoose.model('Location', LocationSchema);
