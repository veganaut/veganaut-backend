'use strict';

var _ = require('lodash');
var db = require('../models');
var constants = require('../utils/constants');
var taskDefinitions = require('../utils/taskDefinitions');

exports.submit = function(req, res, next) {
    var taskType = req.body.type;
    if (typeof constants.TASK_TYPES[taskType] === 'undefined') {
        return next(new Error('Could not find task of type: ' + taskType));
    }

    // Prepare the data for creating the task object
    var taskData = {
        type: taskType,
        personId: req.user.id,
        outcome: req.body.outcome
    };

    // Get the location and (optional) product id
    // TODO: check if the Task really has a location as mainSubject or otherSubjects. For now all tasks do.
    var locationId = req.body.location;
    var productId = req.body.product;

    // Find the location where the task was made
    db.Location.findById(locationId, {attributes: ['id']})
        .then(function(location) {
            if (!location) {
                throw new Error('Could not find location with id: ' + locationId);
            }

            // Set the location id on the task
            taskData.locationId = location.id;

            // No need to pass on anything
            return undefined;
        })
        // TODO: before saving, make sure the user is allowed to complete it

        .then(function() {
            // Create product if the task is AddProduct and the user really filled something out
            if (taskType === constants.TASK_TYPES.AddProduct &&
                _.isObject(taskData.outcome) &&
                taskData.outcome.productAdded === true)
            {
                // Create a new product
                return db.Product.create({
                    name: taskData.outcome.name,
                    locationId: taskData.locationId
                });
            }
            else if (taskDefinitions[taskType].mainSubject === 'product') {
                // Check if the referenced product exists
                return db.Product.findById(productId, {attributes: ['id']})
                    .then(function(product) {
                        if (!product) {
                            throw new Error('Could not find product with id: ' + productId);
                        }
                        return product;
                    })
                ;
            }
        })

        .then(function(product) {
            // If this task is about a product (new or existing one), add a reference to it
            if (product) {
                taskData.productId = product.id;
            }

            // Create the new task
            return db.Task.create(taskData);
        })

        // Sent the created task back
        .then(function(task) {
            return res.status(201).send(task);
        })

        .catch(next)
    ;
};
