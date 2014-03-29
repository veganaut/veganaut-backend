'use strict';

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var GraphNode = mongoose.model('GraphNode');
var ActivityLink = mongoose.model('ActivityLink');

var getNode = function(person, graphnode) {
	var result = {
		id:       person.id,
		fullName: person.fullName,
		team:     person.team,
		type:     person.getType()
	};

	if (typeof graphnode !== 'undefined') {
        if (typeof graphnode.coordX !== 'undefined') {
            result.coordX = graphnode.coordX;
        }
        if (typeof graphnode.coordY !== 'undefined') {
            result.coordY = graphnode.coordY;
        }
	}

	return result;
};

// TODO: this needs unit testing
// TODO: this function is ridiculously long
var getGraph = function(person, cb) {
	async.parallel(
		[
			function (cb) {
				GraphNode
					.find({owner: person.id})
					.populate('target', 'fullName password team')
					.exec(cb);
			},
			function (cb) {
				person.populateActivityLinks(cb);
			}
		],
		function (err, results) {
            if (err) {
                cb(err);
                return;
            }

			var nodes = results[0];

            // Massage nodes to be in the right format
            nodes = _.map(nodes, function(n) {
				return _.assign(getNode(n.target, n), {relation: 'friend'});
            });

            // Add a 'me' node
            nodes.push(_.assign(getNode(person), {
                    relation: 'me',
                    coordX: 0.5,
                    coordY: 0.5
                })
            );

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
                    {source: { $in: personIdList } },
                    {target: { $in: personIdList } }
                ])
				.populate('source')
				.populate('target')
                .exec(function(err, links) {
                    // We need to map these activity links, and transform them into a 2d
                    // structure that maps source/target pairs to counts.
					var newnodes = {};
                    var counts = {};
                    _.each(links, function(l) {
                        counts[l.source.id] = counts[l.source.id] || {};
                        if (typeof counts[l.source.id][l.target.id] === 'undefined') {
                            counts[l.source.id][l.target.id] = {
                                open: 0,
                                completed: 0
                            };
                        }
                        counts[l.source.id][l.target.id][l.success ? 'completed' : 'open'] += 1;
                        _.each([l.source, l.target], function(p) {
                            if (!nodes[p.id]) {
                                newnodes[p.id] = p;
                            }
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

					async.each(
						_.toArray(newnodes),
						function(n, cb) {
							n.populateActivityLinks(cb);
						},
						function (err) {
							if (err) {
								cb(err);
							} else {
								_.each(_.toArray(newnodes), function (n) {
									nodes[n.id] = _.assign(getNode(n), {relation: 'friendOfFriend', fullName: undefined});
								});
								cb(null, {
									nodes: nodes,
									links: graphLinks
								});
							}
						}
					);
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
