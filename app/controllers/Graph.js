'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var GraphNode = mongoose.model('GraphNode');
var ActivityLink = mongoose.model('ActivityLink');

// TODO: this needs unit testing
// TODO: this function is ridiculously long
var getGraph = function(person, cb) {
    var friendIds = {};
    var friendOfFriendIds = {};
    var links = {};
    var persons;
    var graphnodes;

    var getFriendIds = function (cb) {
        ActivityLink
            .find()
            .or([{source: person.id}, {target: person.id}])
            .exec(function (err, ls) {
                if (err) {
                    cb(err);
                    return;
                }

                _.each(ls, function(l) {
                    links[l.id] = l;
                    friendIds[l.target] = true;
                    friendIds[l.source] = true;
                });

                return cb();
            });
    };

    var getFriendOfFriendIds = function (cb) {
        var idlist = _.keys(friendIds);
        ActivityLink
            .find()
            .or([{source: {$in: idlist}}, {target: {$in: idlist}}])
            .exec(function (err, ls) {
                if (err) {
                    cb(err);
                    return;
                }
                _.each(ls, function(l) {
                    links[l.id] = l;
                    friendOfFriendIds[l.target] = true;
                    friendOfFriendIds[l.source] = true;
                });

                return cb();
            });
    };

    var getPersons = function (cb) {
        Person
            .find({_id: {$in: _.keys(_.assign(_.zipObject([[person.id, true]]), friendIds, friendOfFriendIds))}})
            .exec(function (err, result) {
                if (err) {
                    return cb(err);
                }

                persons = result;
                async.each(
                    _.toArray(persons),
                    function(p, cb) {
                        p.populateActivityLinks(cb);
                    },
                    cb
                );
            });
    };

    var getGraphNodes = function (cb) {
        GraphNode
            .find({owner: { $in: _.pluck(persons, 'id') }})
            .exec(function (err, result) {
                if (err) {
                    return cb(err);
                }
                graphnodes = _.indexBy(result, 'target');
                return cb();
            });
    };

    async.series(
        [
            getFriendIds,
            getFriendOfFriendIds,
            getPersons,
            getGraphNodes,
        ],
        function (err) {
            if (err) {
                console.log(err.stack);
                return cb(err);
            }

            // Count links per person pair
            var counts = {};
            _.each(_.toArray(links), function (l) {
                counts[l.source] = counts[l.source] || {};
                if (typeof counts[l.source][l.target] === 'undefined') {
                    counts[l.source][l.target] = {
                        open: 0,
                        completed: 0
                    };
                }
                counts[l.source][l.target][l.success ? 'completed' : 'open'] += 1;
            });

            // Convert links to the format needed by the frontend
            var graphLinks = _.map(counts, function(cc, s) {
                return _.map(cc, function(c, t) {
                    var link = {
                        source: s,
                        target: t
                    };

                    // Add the number of activities if the given person is part of the link
                    if (s === person.id || t === person.id) {
                        link.openActivities = c.open;
                        link.completedActivities = c.completed;
                    }
                    return link;
                });
            });
            graphLinks = _.flatten(graphLinks);

            // Convert persons to the format needed by the frontend
            var graphNodes = _.map(persons, function (p) {
                var result = p.toApiObject();

                if (typeof graphnodes[p.id] !== 'undefined') {
                    result.coordX = graphnodes[p.id].coordX;
                    result.coordY = graphnodes[p.id].coordY;
                }

                if (result.id === person.id) {
                    result.relation = 'me';
                    result.coordX = 0.5;
                    result.coordY = 0.5;
                } else if (friendIds[result.id]) {
                    result.relation = 'friend';
                } else  {
                    result.relation = 'friendOfFriend';
                    result.fullName = undefined;
                }

                return result;
            });

            cb(null, {
                nodes: _.indexBy(graphNodes, 'id'),
                links: graphLinks
            });
        });
};

exports.view = function(req, res, next) {
    // Get the entire social graph for me
    getGraph(req.user, function(err, graph) {
        if (err) {
            return next(err);
        }
        res.send(graph);
    });
};

exports.viewById = function(req, res, next) {
    var personId = req.params.personId;
    Person.findOne({_id: personId}, function(err, person) {
        if (err) {
            return next(err);
        }

        if (!person) {
            res.status(404);
            return next(new Error('Cannot find person with id ' + personId + '.'));
        }

        // Only allowed to query graphs by personId if that person is not a full user
        if (typeof person.password !== 'undefined') {
            res.status(403);
            return next(new Error('Access denied'));
        }

        // Get the graph
        getGraph(person, function(err, graph) {
            if (err) {
                return next(err);
            }
            res.send(graph);
        });
    });
};

exports.update = function(req, res) {
    res.send({ status: 'OK' });
};
