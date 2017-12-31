'use strict';

var _ = require('lodash');
var constants = require('../utils/constants');
var BPromise = require('bluebird');
var bcrypt = require('bcrypt');
var BCRYPT_WORK_FACTOR = 10;
var cryptoUtils = require('../utils/cryptoUtils');

module.exports = function(sequelize, DataTypes) {
    var Person = sequelize.define('person',
        {
            nickname: {
                type: DataTypes.STRING,
                allowNull: false
            },
            fullName: {
                type: DataTypes.STRING
            },
            email: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false
            },
            password: {
                type: DataTypes.STRING
            },
            resetPasswordToken: {
                type: DataTypes.STRING
            },
            resetPasswordExpires: {
                type: DataTypes.DATE
            },
            locale: {
                type: DataTypes.ENUM,
                values: constants.LANGUAGES,
                defaultValue: constants.DEFAULT_LANGUAGE,
                allowNull: false
            },
            accountType: {
                type: DataTypes.ENUM,
                values: Object.keys(constants.ACCOUNT_TYPES),
                defaultValue: constants.ACCOUNT_TYPES.player,
                allowNull: false
            }
        }
    );

    Person.associate = function(models) {
        Person.hasMany(models.Task);
    };

    Person.hook('beforeSave', function(user) {
        // Only hash the password if it has been modified (or is new)
        if (user.changed('password')) {
            return bcrypt.hash(user.password, BCRYPT_WORK_FACTOR).then(function(hash) {
                // Override the cleartext password with the hashed one
                user.password = hash;
            });
        }
    });

    Person.hook('beforeSave', function(user) {
        // TODO: Change the reset token to be as secure as passwords using bcrypt
        // Only hash the resetPasswordToken if it's set and changed
        if (user.resetPasswordToken && user.changed('resetPasswordToken')) {
            // Override the cleartext token with the hashed one
            user.resetPasswordToken = cryptoUtils.hashResetToken(user.resetPasswordToken);
        }
    });

    Person.prototype.verify = function(candidatePassword) {
        if (typeof this.password !== 'string') {
            // TODO: we should really have error codes that the frontend can understand (and translate).
            return BPromise.reject(new Error('You have not set a password yet. Click on "I dont\'t know my password".'));
        }
        return bcrypt.compare(candidatePassword, this.password);
    };

    /**
     * Counts the total number of completed tasks and added locations
     * of this player. The properties completedTasks and addedLocations
     * are added to the instance.
     * @returns {Promise}
     */
    Person.prototype.calculateTaskCounts = function() {
        var that = this;

        // First, prepare the condition to separate the AddLocation from the other tasks
        var isAddLocationCondition = sequelize.literal(
            'type = ' + sequelize.escape(constants.TASK_TYPES.AddLocation)
        );

        return that
            .getTasks({
                // Count the AddLocation tasks separately
                attributes: [
                    // Using floor gets sequelize to spit out a number instead of string
                    [sequelize.fn('FLOOR', sequelize.fn('COUNT', '*')), 'count'],
                    [isAddLocationCondition, 'isAddLocation']
                ],
                where: {
                    // Don't count automatically triggered tasks
                    triggeredById: null
                },
                group: [isAddLocationCondition],
                raw: true
            })
            .then(function(numTasksCounts) {
                // Initialise the counts to 0
                that.completedTasks = 0;
                that.addedLocations = 0;

                // Add the actual counts from the db
                _.each(numTasksCounts, function(numTasks) {
                    if (numTasks.isAddLocation) {
                        // Add the count of the AddLocation tasks
                        that.addedLocations += numTasks.count;
                    }

                    // Both AddLocation and other tasks count towards the total completed tasks
                    that.completedTasks += numTasks.count;
                });
            });
    };

    /**
     * Convert the person for transferring over the API
     * @returns {{}}
     */
    Person.prototype.toJSON = function () {
        var doc = this.get();
        var ret = _.pick(doc, [
            'id',
            'nickname',
            'fullName',
            'email',
            'locale',
            'accountType'
        ]);

        // These might have been set by calculateTaskCounts()
        _.assign(ret, _.pick(this, [
            'completedTasks',
            'addedLocations'
        ]));
        return _.omit(ret, _.isNull);
    };

    return Person;
};
