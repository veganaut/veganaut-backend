/**
 * Mongoose schema for a mission.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Visit');
require('./Person');
var Visit = mongoose.model('Visit');
var Person = mongoose.model('Person');

var MissionSchema = new Schema({
    type: { type: String, enum: ['optionsAvailable', 'whatOptions', 'buyOptions', 'staffFeedback', 'rateLocation'], required: true },
    visit: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    outcome: { type: Schema.Types.Mixed, required: true },
    points: { type: Schema.Types.Mixed },
});

MissionSchema.pre('save', function(next) {
    var mission = this;

    if (typeof mission.points === 'undefined') {
        Visit.findById(mission.visit, function (err, visit) {
            if (err) {
                return next(err);
            } else if (!visit) {
                return next(new Error('Unknown visit id ' + mission.visit));
            }
            Person.findById(visit.person, function (err, person) {
                mission.points = {};
                mission.points[person.team] = 3;
                next(err);
            });
        });
    } else {
        return next();
    }
});

mongoose.model('Mission', MissionSchema);
