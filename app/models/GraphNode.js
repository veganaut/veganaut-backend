/**
 * Mongoose schema for a person
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var graphNodeSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'Person' },
    target: { type: Schema.Types.ObjectId, ref: 'Person' },

    coordX: Number,
    coordY: Number
});

mongoose.model('GraphNode', graphNodeSchema);
