/**
 * Mongoose schema for a visit.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('./Mission');
var Mission = mongoose.model('Mission');

var VisitSchema = new Schema({
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    missions: [Mission.schema],
    completed: Date
});

mongoose.model('Visit', VisitSchema);
