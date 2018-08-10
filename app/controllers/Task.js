'use strict';

var _ = require('lodash');
var db = require('../models');
var constants = require('../utils/constants');
var taskDefinitions = require('../utils/taskDefinitions');

/**
 * Gets a veganize task that is related (same task type, completed at same location type
 * and often at the same location) and which's outcome can be used as inspiration for
 * users that are about to complete the task.
 *
 * @param req
 * @param res
 * @param next
 */
exports.getRelatedVeganizeTask = function(req, res, next) {
    var taskType = req.query.type;
    var locationType = req.query.locationType;
    var locationId = req.query.locationId;

    var taskDefinition = taskDefinitions[taskType];
    if (typeof taskDefinition === 'undefined' || taskDefinition.category !== 'veganize') {
        return next(new Error('"' + taskType + '" is not a valid veganize task.'));
    }

    // Select only tasks of the same type that have non-empty "notes"
    var where = {
        type: taskType,
        'outcome.notes': {
            $ne: null
        }
    };

    // If there is a logged in user, exclude tasks by that user
    if (req.user) {
        where.personId = {
            $ne: req.user.id
        };
    }

    db.Task
        .find({
            where: where,
            // Order in a way to mostly select tasks at the given location, but not always
            order: [
                [db.sequelize.literal('CASE WHEN "location"."id" = ' + db.sequelize.escape(locationId) + ' ' +
                    'THEN random() + 0.5 ELSE random() END'), 'DESC'
                ]
            ],
            include: [
                {
                    model: db.Location,
                    attributes: ['id', 'name', 'addressCity'],
                    where: {
                        // Select tasks at locations of the given type
                        type: locationType
                    }
                },
                {
                    model: db.Person,
                    attributes: ['nickname']
                }
            ]
        })
        .then(function(task) {
            // Return as json (to be sure to have the correct content-type even when the result is empty)
            return res.json(task);
        })
        .catch(next)
    ;
};


/**
 * Gets statistics for a given task type at a given location.
 *
 * @param req
 * @param res
 * @param next
 */
exports.getStatistics = function(req, res, next) {
    var taskType = req.query.type;
    var locationId = req.query.locationId;

    db.Task
        .count({
            where: {
                type: taskType,
                locationId: locationId
            }
        })
        .then(function(count) {
            return res.send({
                count: count
            });
        })
        .catch(next)
    ;
};


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

    // Find the location where the task was made (also include soft-deleted locations)
    db.Location.findById(locationId, {attributes: ['id'], paranoid: false})
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
