/**
 * Mongoose schema for a mission.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MissionSchema = new Schema({
    type: { type: String, enum: ['optionsAvailable', 'whatOptions', 'buyOptions', 'staffFeedback', 'rateLocation'] },
    visit: { type: Schema.Types.ObjectId, ref: 'Visit' },
    outcome: Schema.Types.Mixed,
    points: Schema.Types.Mixed
});

mongoose.model('Mission', MissionSchema);
