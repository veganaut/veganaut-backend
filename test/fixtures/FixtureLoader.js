/**
 * This script prepares a database with test fixtures.
 */
'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var db = require('../../app/models');

var ID_SEQUENCE_START = 100000;

var load = function(fixtures) {
    // Clear the db
    var tableNames = _.pluck(_.values(db.sequelize.models), 'tableName');
    return db.sequelize.query('TRUNCATE TABLE "' + tableNames.join('", "') + '"')
        .then(function() {
            // TODO WIP: make this a fixed part of the db schemas, we want this for production as well
            // Get the models that have (auto-increment) ids and set the sequence of the id
            // to something high to not clash with the fixtures.
            var modelsWithIds = _.map(_.filter(db.sequelize.models, function(model) {
                return (typeof model.attributes.id !== 'undefined');
            }));
            return db.sequelize.query(_.map(modelsWithIds, function(model) {
                return 'SELECT setval(\'' + model.tableName + '_id_seq\', ' + ID_SEQUENCE_START + ');';
            }).join(' '));
        })
        .then(function() {
            // Save all the fixtures
            return BPromise.mapSeries(_.values(fixtures), function(fix) {
                return fix.save();
            });
        })
        .catch(function(err) {
            console.log('Error while loading fixtures: ', err);
        });
};
exports.load = load;
