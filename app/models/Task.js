'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var jsonValidate = require('jsonschema').validate;
var constants = require('../utils/constants');
var taskDefinitions = require('../utils/taskDefinitions');

/**
 * JSON Schemas for the outcomes of all the missions
 * TODO: move this to the taskDefinitions
 * @type {{}}
 */
var OUTCOME_SCHEMAS = {
    AddLocation: {
        type: 'object',
        properties: {
            locationAdded: {type: 'boolean'}
        },
        required: ['locationAdded'],
        additionalProperties: false
    },
    AddProduct: {
        type: 'object',
        properties: {
            productAdded: {type: 'boolean'},
            name: {type: 'string'}
        },
        required: ['productAdded', 'name'],
        additionalProperties: false
    },
    SetLocationName: {
        type: 'object',
        properties: {
            name: {type: 'string'}
        },
        required: ['name'],
        additionalProperties: false
    },
    SetLocationType: {
        type: 'object',
        properties: {
            locationType: {
                type: 'string',
                enum: ['gastronomy', 'retail']
            }
        },
        required: ['locationType'],
        additionalProperties: false
    },
    SetLocationDescription: {
        type: 'object',
        properties: {
            description: {type: 'string'}
        },
        required: ['description'],
        additionalProperties: false
    },
    SetLocationCoordinates: {
        type: 'object',
        properties: {
            latitude: {type: 'number'},
            longitude: {type: 'number'}
        },
        required: ['latitude', 'longitude'],
        additionalProperties: false
    },
    // SetLocationAddress: {},
    SetLocationWebsite: {
        type: 'object',
        properties: {
            website: {type: 'string'},
            isAvailable: {type: 'boolean'}
        },
        required: ['website', 'isAvailable'],
        additionalProperties: false
    },
    // SetLocationFacebook: {},
    // SetLocationTwitter: {},
    // SetLocationOpeningHours: {},
    SetLocationProductListComplete: {
        type: 'object',
        properties: {
            completionState: {
                type: 'string',
                enum: Object.keys(constants.PRODUCT_LIST_STATES)
            }
        },
        required: ['completionState'],
        additionalProperties: false
    },
    // SetLocationCarnistLevel: {},
    // SetLocationLabellingLevel: {},
    // SetLocationPriceLevel: {},
    SetLocationExistence: {
        type: 'object',
        properties: {
            existence: {
                type: 'string',
                enum: Object.keys(constants.LOCATION_EXISTENCE_STATES)
            },
            notes: {type: 'string'}
        },
        required: ['existence'],
        additionalProperties: false
    },
    SetProductName: {
        type: 'object',
        properties: {
            name: {type: 'string'}
        },
        required: ['name'],
        additionalProperties: false
    },
    SetProductAvailability: {
        type: 'object',
        properties: {
            availability: {
                type: 'string',
                enum: ['always', 'sometimes', 'not']
            },
            notes: {type: 'string'}
        },
        required: ['availability'],
        additionalProperties: false
    },
    HowWellDoYouKnowThisLocation: {
        type: 'object',
        properties: {
            knowLocation: {
                type: 'string',
                enum: ['regular', 'fewTimes', 'once', 'never']
            },
            notes: {type: 'string'}
        },
        required: ['knowLocation'],
        additionalProperties: false
    },
    // RateLocationStaffVeganKnowledge: {},
    RateLocationQuality: {
        type: 'object',
        properties: {
            quality: {
                type: 'integer',
                minimum: 1,
                maximum: 5
            }
        },
        required: ['quality'],
        additionalProperties: false
    },
    TagLocation: {
        type: 'object',
        properties: {
            tags: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: constants.LOCATION_TAGS
                }
            }
        },
        required: ['tags'],
        additionalProperties: false
    },
    RateProduct: {
        type: 'object',
        properties: {
            rating: {
                type: 'integer',
                minimum: 1,
                maximum: 5
            }
        },
        required: ['rating'],
        additionalProperties: false
    },
    HaveYouBeenHereRecently: {
        type: 'object',
        properties: {
            beenHere: {
                type: 'string',
                enum: ['yes', 'yesRightNow', 'no']
            }
        },
        required: ['beenHere'],
        additionalProperties: false
    },
    GiveFeedback: {
        type: 'object',
        properties: {
            commitment: {
                type: 'string',
                enum: ['yes', 'maybe', 'no']
            },
            notes: {type: 'string'}
        },
        required: ['commitment'],
        additionalProperties: false
    },
    MentionVegan: {
        type: 'object',
        properties: {
            commitment: {
                type: 'string',
                enum: ['yes', 'maybe', 'no']
            },
            notes: {type: 'string'}
        },
        required: ['commitment'],
        additionalProperties: false
    },
    BuyProduct: {
        type: 'object',
        properties: {
            commitment: {
                type: 'string',
                enum: ['yes', 'maybe', 'no']
            },
            notes: {type: 'string'}
        },
        required: ['commitment'],
        additionalProperties: false
    }
    // ExplainVegan: {},
    // AskForLabelling: {},
    // SuggestProducts: {},
    // ReserveExplicitVegan: {},
    // MarkForFutureVisit: {},
    // DeclareVeganizeFocus: {}
};


module.exports = function(sequelize, DataTypes) {
    var Task = sequelize.define('task',
        {
            type: {
                type: DataTypes.ENUM,
                values: Object.keys(constants.TASK_TYPES),
                allowNull: false
            },
            skipped: { // TODO WIP: implement
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            byNpc: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
            flow: { // TODO WIP: implement
                type: DataTypes.UUID
            },
            flowPosition: { // TODO WIP: implement
                type: DataTypes.INTEGER
            },
            personId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            outcome: {
                type: DataTypes.JSONB,
                allowNull: false
            }
        },
        {
            updatedAt: false,
            validate: {
                validateOutcome: function() {
                    // Validate with the schema
                    var result = jsonValidate(this.outcome, OUTCOME_SCHEMAS[this.type]);

                    if (result.errors.length > 0) {
                        // Simply through the first error
                        var error = result.errors[0];
                        throw new Error(
                            // JSON validator calls the root property "instance", we want it to show as "outcome"
                            error.property.replace('instance', 'outcome') +
                            ' ' + error.message
                        );
                    }
                }
            }
        }
    );

    Task.associate = function(models) {
        // TODO WIP: validate that either locationId or productId is set
        Task.belongsTo(models.Location);
        Task.belongsTo(models.Product);
        Task.belongsTo(models.Person);
        Task.hasOne(Task, {
            as: 'triggeredBy'
        });
        Task.hasOne(Task, {
            as: 'confirming' // TODO WIP: implement
        });
    };

    // TODO: prevent task from being edited (should only ever be created)

    Task.hook('afterSave', function(task) {
        // Select the task of the same type by the same person
        var previousTaskQuery = {
            id: {
                $ne: task.id
            },
            type: task.type,
            personId: task.personId
        };

        // And at the same location or for the same product
        if (task.locationId) {
            previousTaskQuery.locationId = task.locationId;
        }
        if (task.productId) {
            previousTaskQuery.productId = task.productId;
        }

        // TODO WIP: All saves should be done as transactions!
        return Task.findOne({
            where: previousTaskQuery,
            order: [['createdAt', 'DESC']]
        }).then(function(previousTask) {
            // Set to undefined if it wasn't found (we don't want null)
            previousTask = previousTask ? previousTask : undefined;

            // Populate the location and product to notify it of the new task
            // TODO: should only populate if not already done?
            var followUps = [];
            if (task.locationId) {
                // Inform the location (also when it's soft-deleted)
                followUps.push(task.getLocation({paranoid: false}).then(function(location) {
                    return location.onTaskCompleted(task, previousTask);
                }));
            }
            if (task.productId) {
                followUps.push(task.getProduct().then(function(product) {
                    return product.onTaskCompleted(task, previousTask);
                }));
            }

            // Check for automatically triggered SetLocationExistence
            var triggerExistence = taskDefinitions[task.type].triggerExistence;
            if (triggerExistence) {
                // Check if the condition for triggering holds
                if (triggerExistence.triggerWhen.indexOf(task.outcome[triggerExistence.outcomeToCheck]) > -1) {
                    // TODO WIP: fill in flow and other info?
                    followUps.push(Task.create({
                        type: constants.TASK_TYPES.SetLocationExistence,
                        personId: task.personId,
                        triggeredById: task.id,
                        locationId: task.locationId,
                        outcome: {
                            existence: constants.LOCATION_EXISTENCE_STATES.existing
                        }
                    }));
                }
            }

            // Return after having done all follow ups
            return BPromise.all(followUps);
        });
    });

    /**
     * Returns whether the given person has indicated through tasks
     * that they have visited the given location.
     * @param {number} personId
     * @param {number} locationId
     * @returns {Promise}
     */
    Task.hasPersonBeenAtLocation = function(personId, locationId) {
        return Task
            .count({
                where: {
                    personId: personId,
                    locationId: locationId,
                    // TODO WIP: check if this is really the good condition for considering someone knows a place (e.g. should time/createdAt be included)
                    $or: [
                        {
                            type: 'HaveYouBeenHereRecently',
                            'outcome.beenHere': {
                                $or: ['yes', 'yesRightNow']
                            }
                        },
                        {
                            type: 'HowWellDoYouKnowThisLocation',
                            'outcome.knowLocation': {
                                $or: ['regular', 'fewTimes', 'once']
                            }
                        }
                    ]
                }
            })
            .then(function(taskCount) {
                return (taskCount > 0);
            });
    };

    /**
     * Convert the task for transferring over the API
     * @returns {{}}
     */
    Task.prototype.toJSON = function() {
        var doc = this.get();
        var ret = _.pick(doc, [
            'id',
            'type',
            'outcome',
            'createdAt'
        ]);

        // Expose the ids, but with a different name
        if (doc.personId) {
            ret.person = doc.personId;
        }
        if (doc.locationId) {
            ret.location = doc.locationId;
        }
        if (doc.productId) {
            ret.product = doc.productId;
        }

        return _.omit(ret, _.isNull);
    };

    return Task;
};
