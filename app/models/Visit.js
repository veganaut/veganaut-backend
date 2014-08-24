/**
 * Mongoose schema for a visit.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VisitSchema = new Schema({
    person: { type: Schema.Types.ObjectId, ref: 'Person' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    completed: Date
});

mongoose.model('Visit', VisitSchema);
