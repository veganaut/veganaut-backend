/**
 * Mongoose schema for a location.
 */

'use strict';

var util = require('util');
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
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

    // Maps person ids to their points at time updatedAt.
    points: {type: Schema.Types.Mixed, default: {}}, // TODO: replace this with a more specific schema

    // The person that currently has the most points
    owner: {type: Schema.Types.ObjectId, ref: 'Person', required: true},

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

    // Points for each person diminish exponentially
    // TODO: exponential decrease gets too slow after some time... we should have a minimal rate of decrease.
    _.forOwn(that.points, function(personPoints, personId) {
        // Calculate the new points
        var newPoints = personPoints * Math.pow(POINTS_DECREASE_FACTOR, elapsed);

        if (newPoints < 1) {
            // If there is less than 1 point left, remove the person from the list of points
            delete points[personId];
        }
        else {
            // Still enough points, round it and set it
            points[personId] = Math.round(newPoints);
        }
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
    var owner = this.owner;
    var ownerPoints = points[owner] || 0;

    // Check if this mission gave any points
    var missionPerson;
    if (mission.points > 0) {
        // Add the points from the completed mission
        missionPerson = mission.populated('person') ? mission.person.id : mission.person;
        points[missionPerson] = (points[missionPerson] || 0) + mission.points;

        // Check if the new person has the most points
        if (points[missionPerson] > ownerPoints) {
            owner = missionPerson;
        }
    }

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
    this.owner = owner;
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
        var ret = _.pick(doc, ['name', 'description', 'link', 'type', 'id', 'owner', 'updatedAt']);

        // Add lat/lng in the format the frontend expects
        if (util.isArray(doc.coordinates)) {
            ret.lng = doc.coordinates[0];
            ret.lat = doc.coordinates[1];
        }

        // Compute and include points if the are present (= were loaded from db)
        if (typeof doc.points !== 'undefined') {
            ret.points = doc.computeCurrentPoints();
            // TODO: only expose points of owner and current user?
        }

        // Add the quality and effort
        ret.quality = {
            average: doc.quality.average,
            numRatings: doc.quality.count
        };
        ret.effort = {
            average: doc.effort.average,
            numRatings: doc.effort.count
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

/**
 * Creates a $within query based on the given center (lat/lng) and radius
 * @param {number} lat
 * @param {number} lng
 * @param {number} radius Radius around the lat/lng in meters to query for locations.
 * @returns {{}|undefined}
 */
locationSchema.statics.getCenterQuery = function(lat, lng, radius) {
    var query;

    // Approximate earth radius
    var EARTH_RADIUS_METERS = 6371 * 1000;
    if (typeof lat !== 'undefined' && typeof lng !== 'undefined' && typeof radius !== 'undefined') {
        // Create the $centerSphere query
        query = {
            $within: {
                $centerSphere: [[lng, lat], radius / EARTH_RADIUS_METERS]
            }
        };
    }

    return query;
};

mongoose.model('Location', locationSchema);
