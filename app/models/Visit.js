/**
 * Mongoose schema for a visit.
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var missionSchema = require('./missionSchema');

var visitSchema = new Schema({
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    missions: [missionSchema], // Mission is defined in a sub-schema
    completed: Date
});

/**
 * Sums up the points made in all the missions in this visit
 * @returns {{}}
 */
visitSchema.methods.getTotalPoints = function() {
    var totalPoints = {};
    _.forEach(this.missions, function(mission) {
        _.forOwn(mission.points, function(points, team) {
            totalPoints[team] = totalPoints[team] || 0;
            totalPoints[team] += points;
        });
    });

    return totalPoints;
};

/**
 * Returns this visit ready to be sent to the frontend
 * @returns {{}}
 */
visitSchema.methods.toApiObject = function () {
    var missions = _.map(this.missions, function(m) {
        return _.pick(m, ['id', 'type', 'outcome', 'points']);
    });
    return _.assign(
        _.pick(this, ['id', 'person', 'location', 'completed']),
        {
            missions: missions,
            totalPoints: this.getTotalPoints()
        }
    );
};

/**
 * When a visit is created, notify the corresponding location. This will
 * re-compute the location's score.
 */
visitSchema.pre('save', function(next) {
    var that = this;
    if (!that.isNew) { return next(); }

    require('./Location.js');
    var Location = mongoose.model('Location');

    Location.findById(that.location, function(err, l) {
        if (err) { return next(err); }
        l.notifyVisitCreated(that, next);
    });
});

mongoose.model('Visit', visitSchema);
