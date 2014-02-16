'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var Activity = mongoose.model('Activity');
var ActivityLink = mongoose.model('ActivityLink');
var Person = mongoose.model('Person');
var GraphNode = mongoose.model('GraphNode');

exports.referenceCode = function(req, res) {
    // TODO: handle submissions of already existing users
    var activityLink;
    var findActivityLink = function(cb) {
        var referenceCode = req.body.referenceCode;
        ActivityLink.findOne({referenceCode: referenceCode}, function(err, link) {
            if (!err && !link) {
                // TODO: what type is err usually?
                // TODO: error code, this is not a 500, but a 400
                err = 'Could not find activityLink with referenceCode: ' + referenceCode;
            }
            else if (link.success === true) {
                err = 'This referenceCode has already been used: ' + referenceCode;
            }
            activityLink = link;
            cb(err);
        });
    };

    var updateActivityLink = function(cb) {
        activityLink.success = true;
        activityLink.save(function(err) {
            cb(err);
        });
    };

    var createGraphForPerson = function(cb) {
        var node = new GraphNode({
            owner: activityLink.targets[0],
            target: activityLink.sources[0]
        });
        node.save(function(err) {
            cb(err);
        });
    };

    // TODO: better error and input checking along the way
    async.series([
        findActivityLink,
        updateActivityLink,
        createGraphForPerson
    ], function(err) {
        if (err) {
            res.send(500, {error: err});
        }
        else {
            res.send(_.pick(activityLink, 'referenceCode', 'targets'));
        }
    });
};

exports.link = function(req, res) {
    // TODO: document and find a better solution for this async call
    var user = req.user;
    var activity;
    var targetPerson;
    var targetWasCreated = false;
    var activityLink;

    var findActivity = function(cb) {
        if (req.body.activity) {
            Activity.findOne({_id: req.body.activity.id}, function(err, a) {
                // TODO: for some reason, the _id keeps changing when running jasmine tests, so this never works
                if (!err && !a) {
                    // TODO: what type is err usually?
                    err = 'Could not find activity with id: ' + req.body.activity.id;
                }
                activity = a;
                cb(err);
            });
        }
        else {
            cb();
        }
    };

    var createPersonIfNeeded = function(cb) {
        // Check if the person has an id
        var person = req.body.targets[0];
        if (typeof person.id !== 'undefined') {
            // This person is already existing, return
            targetPerson = person;
            targetWasCreated = false;
            cb(null);
        }
        else {
            // TODO: sanitize data
            var newPerson = new Person(person);
            newPerson.save(function(err) {
                targetPerson = newPerson;
                targetWasCreated = true;
                cb(err);
            });
        }
    };

    var createNodeIfNeeded = function(cb) {
        if (targetWasCreated) {
            var newNode = new GraphNode({
                owner: user.id,
                target: targetPerson.id
            });
            newNode.save(function(err) {
                cb(err);
            });
        }
        else {
            cb(null);
        }
    };

    var createLink = function(cb) {
        var link = new ActivityLink({
            activity: activity ? activity.id : undefined,
            sources: [user.id],
            targets: [targetPerson.id],
            location: req.body.location,
            startDate: req.body.startDate
        });

        link.save(function(err) {
            activityLink = link;
            cb(err);
        });
    };

    // TODO: better error and input checking along the way
    async.series([
        findActivity,
        createPersonIfNeeded,
        createNodeIfNeeded,
        createLink
    ], function(err) {
        if (err) {
            res.send(500, {error: err});
        }
        else {
            res.send(201, activityLink); // TODO: don't send whole object
        }
    });
};
