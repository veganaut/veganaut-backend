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
        var allPersonIds = _.union([person.id], _.keys(friendIds), _.keys(friendOfFriendIds));
        Person
            .find({_id: {$in: allPersonIds}})
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
            getGraphNodes
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
                    return {
                        source: s,
                        target: t,
                        openActivities: c.open,
                        completedActivities: c.completed
                    };
                });
            });
            graphLinks = _.flatten(graphLinks);

            // Convert persons to the format needed by the frontend
            var graphNodes = _.map(persons, function (p) {
                var result = p.toJSON();

                if (typeof graphnodes[p.id] !== 'undefined') {
                    result.coordX = graphnodes[p.id].coordX;
                    result.coordY = graphnodes[p.id].coordY;
                }

                if (result.id === person.id) {
                    result.relation = 'me';
                    result.coordX = 0.5;
                    result.coordY = 0.5;
                }
                else if (friendIds[result.id]) {
                    result.relation = 'friend';
                }
                else  {
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
    Person.findById(personId, function(err, person) {
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

exports.update = function(req, res, next) {
    var nodes = _.toArray(req.body.nodes);

    var error = _.find(_.map(nodes, function (node) {
        if (typeof node.id === 'undefined') {
            return new Error('Node without id.');
        } else if (typeof node.coordX === 'undefined') {
            return new Error('Node without coordX.');
        } else if (typeof node.coordY === 'undefined') {
            return new Error('Node without coordY.');
        }
    }));
    if (error) {
        res.status(400);
        return next(error);
    }

    async.each(
        nodes,
        function (node, cb) {
            GraphNode
                .findOne({owner: req.user.id, target: node.id})
                .exec(function(err, graphnode) {
                    // If there is an error return it, if the node already exists, there is nothing to do
                    if (err) {
                        return cb(err);
                    }

                    if (!graphnode) {
                        graphnode = new GraphNode({
                            owner: req.user.id,
                            target: node.id,
                            coordX: node.coordX,
                            coordY: node.coordY
                        });
                    } else {
                        graphnode.coordX = node.coordX;
                        graphnode.coordY = node.coordY;
                    }

                    graphnode.save(cb);
                });
        },
        function (err) {
            if (err) {
                return next(err);
            }

            res.send({ status: 'OK' });
        }
    );
};
