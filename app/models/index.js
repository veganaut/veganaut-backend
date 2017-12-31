'use strict';
/**
 * Helper for loading all the Sequelize models and
 * establishing the connection to the DB
 */

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var config = require('../config.js');
var db = {};

// Initialise the db connection
// TODO: Better initialise the connection somewhere else?
var sequelize = new Sequelize(config.database.connectionUri, {
    logging: false
});

fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[_.capitalize(model.name)] = model;
    });

Object.keys(db).forEach(function(modelName) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
