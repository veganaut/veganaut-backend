'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var GraphNode = mongoose.model('GraphNode');
var ActivityLink = mongoose.model('ActivityLink');

var getNode = function(person, graphnode) {
	var result = {
		id:       person.id,
		fullName: person.fullName,
		team:     person.team,
		type:     'maybe',
	};

	if (typeof graphnode !== 'undefined') {
        if (typeof graphnode.coordX !== 'undefined') {
            result.coordX = graphnode.coordX;
        }
        if (typeof graphnode.coordY !== 'undefined') {
            result.coordY = graphnode.coordY;
        }
	}

	if (typeof person.password !== 'undefined') {
		result.type = 'user';
	}

	return result;
};

// TODO: this needs unit testing
// TODO: this function is ridiculously long
var getGraph = function(person, cb) {
    GraphNode
        .find({owner: person.id})
        .populate('target', 'fullName password team')
        .exec(function(err, nodes) {
            if (err) {
                cb(err);
                return;
            }

            // Massage nodes to be in the right format
            nodes = _.map(nodes, function(n) {
				return _.assign(getNode(n.target, n), {relation: 'friend'});
            });

            // Add a 'me' node
            nodes.push(_.assign(
				getNode(person),
				{
					relation: 'me',
					coordX: 0.5,
					coordY: 0.5
				}
			));

            // Get the list of all the people we want to fine the links for
            var personIdList = _.pluck(nodes, 'id');

            // transform this into a map for easier random access
            nodes = _.indexBy(nodes, 'id');

            // Count the activities between the people in the social graph
            // Get all the activities of the user and the friends
            // (including activities to friends of friends)
            ActivityLink
                .find()
                .or([
                    {sources: { $in: personIdList } },
                    {targets: { $in: personIdList } }
                ])
				.populate('sources')
				.populate('targets')
                .exec(function(err, links) {
                    // We need to map these activity links, and transform them into a 2d
                    // structure that maps source/target pairs to counts.
                    var counts = {};
                    _.each(links, function(l) {
                        _.each(l.sources, function(s) {
                            _.each(l.targets, function(t) {
                                counts[s.id] = counts[s.id] || {};
                                if (typeof counts[s.id][t.id] === 'undefined') {
                                    counts[s.id][t.id] = {
                                        open: 0,
                                        completed: 0
                                    };
                                }
                                counts[s.id][t.id][l.success ? 'completed' : 'open'] += 1;
								_.each([s, t], function(p) {
									if (!nodes[p.id]) {
										nodes[p.id] = _.assign(getNode(p, undefined), {relation: 'friendOfFriend', fullName: undefined});
									}
									if (l.success && nodes[p.id].type === 'maybe') {
										nodes[p.id].type = 'baby';
									}
								});
                            });
                        });
                    });

                    // Convert to the format needed by the frontend
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

                    cb(null, {
                        nodes: nodes,
                        links: graphLinks
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
