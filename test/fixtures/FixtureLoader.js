/**
 * This script prepares a database with test fixtures.
 */
'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var db = require('../../app/models');

var load = function(fixtures) {
    // Clear the db
    var tableNames = _.pluck(_.values(db.sequelize.models), 'tableName');
    return db.sequelize.query('TRUNCATE TABLE "' + tableNames.join('", "') + '"')
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
