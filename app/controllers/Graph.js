'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var GraphNode = mongoose.model('GraphNode');
var ActivityLink = mongoose.model('ActivityLink');

// TODO: this needs unit testing
var getGraph = function(person, cb) {
    GraphNode
        .find({owner: person.id})
        .populate('target', 'fullName password')
        .exec(function(err, nodes) {
            if (err) {
                cb(err);
                return;
            }

            // Massage nodes to be in the right format
            nodes = _.map(nodes, function(n) {
                var result = {};
                result.fullName = n.target.fullName;
                result.id = n.target.id;
                if (typeof n.target.coordX !== 'undefined') {
                    result.coordX = n.target.coordX;
                }
                if (typeof n.target.coordY  !== 'undefined') {
                    result.coordY = n.target.coordY;
                }

                // Compute the type of node
                result.type = 'maybe';
                if (typeof n.target.password !== 'undefined') {
                    result.type = 'user';
                }

                return result;
            });

            // add a 'me' node
            nodes.push({
                fullName: person.fullName,
                id: person.id,
                type: 'me',
                coordX: 0.5,
                coordY: 0.5
            });

            // transform this into a map for easier random access
            nodes = _.indexBy(nodes, 'id');

            // Count the activities between the people in the social graph
            // FIXME: currently, we only include activities where 'me' is the source or
            //        target. In principle, we should have activities between all members of
            //        the social graph.
            ActivityLink
                .find()
                .or([{sources: person.id}, {targets: person.id}])
                .exec(function(err, links) {
                    // We need to map these activity links, and transform them into a 2d
                    // structure that maps source/target pairs to counts.
                    var counts = {};
                    _.each(links, function(l) {
                        _.each(l.sources, function(s) {
                            _.each(l.targets, function(t) {
                                counts[s] = counts[s] || {};
                                if (typeof counts[s][t] === 'undefined') {
                                    counts[s][t] = {
                                        open: 0,
                                        completed: 0
                                    };
                                }
                                counts[s][t][l.success ? 'completed' : 'open'] += 1;
                            });
                        });
                    });

                    var countsAsList = _.map(counts, function(cc, s) {
                        return _.map(cc, function(c, t) {
                            return {
                                source: s,
                                target: t,
                                openActivities: c.open,
                                completedActivities: c.completed
                            };
                        });
                    });
                    countsAsList = _.flatten(countsAsList);

                    // Finally, we promote some 'maybe's to 'baby' state if they have activities
                    _.each(countsAsList, function(c) {
                        if (c.completedActivities > 0) {
                            if (nodes[c.source] && nodes[c.source].type === 'maybe') {
                                nodes[c.source].type = 'baby';
                            }
                            if (nodes[c.target] && nodes[c.target].type === 'maybe') {
                                nodes[c.target].type = 'baby';
                            }
                        }
                    });


                    cb(null, {
                        nodes: nodes,
                        links: countsAsList
                    });
                })
            ;
        })
    ;
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
