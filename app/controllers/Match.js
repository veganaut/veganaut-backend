'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var constants = require('../utils/constants');

// Values used in scores computation
var SCORE_FACTOR_CAPTURED = -1.0;
var SCORE_FACTOR_BABIES   = 0.5;

// Computes the scores of the current match. This uses a very naïve approach,
// iterating through all the people in the database.
var computeScores = function(next) {
    var result = {};
    _.each(constants.TEAMS, function(team) {
        result[team] = {
            score: 0,
            users: 0,
            babies: 0,
            captured: 0
        };
    });

    Person.find()
        .where('team').exists()
        .exec(function(err, people) {
        if (err) { return next(err); }

        async.each(people,
            function(person, next) { person.populateActivityLinks(next); },
            function(err) {
                if (err) { return next(err); }

                _.each(people, function(person) {
                    switch (person.getType()) {
                        case 'baby':
                            result[person.team].babies += 1;
                            break;
                        case 'user':
                            result[person.team].users += 1;
                            break;
                        default:
                            throw new Error('Illegal person type: ' + person.getType());
                    }

                    if (person.capture.active) {
                        result[person.team].captured += 1;
                    }
                });

                _.each(constants.TEAMS, function(team) {
                    result[team].score = result[team].users +
                                         SCORE_FACTOR_CAPTURED * result[team].captured +
                                         SCORE_FACTOR_BABIES * result[team].babies;
                    result[team].score = Math.round(result[team].score);
                });

                return next(null, result);
            }
        );
    });
};

exports.current = function(req, res, next) {
    computeScores(function(err, scores) {
        if (err) { return next(err); }

        res.send(scores);
    });
};
