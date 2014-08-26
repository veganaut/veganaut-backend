/**
 * Mongoose schema for a mission.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Person');
var Person = mongoose.model('Person');

var MissionSchema = new Schema({
    type: { type: String, enum: ['optionsAvailable', 'whatOptions', 'buyOptions', 'staffFeedback', 'rateLocation'], required: true },
    outcome: { type: Schema.Types.Mixed, required: true },
    points: { type: Schema.Types.Mixed },
});

MissionSchema.pre('save', function(next) {
    var mission = this;

    if (typeof mission.points === 'undefined') {
        var visit = mission.parent();
        Person.findById(visit.person, function (err, person) {
            mission.points = {};
            mission.points[person.team] = 3;
            next(err);
        });
    } else {
        return next();
    }
});

mongoose.model('Mission', MissionSchema);
