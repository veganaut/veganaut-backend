'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var GraphNode = mongoose.model('GraphNode');
var ActivityLink = mongoose.model('ActivityLink');

exports.view = function(req, res) {
    var me = req.user;

    // Get the entire social graph for me
    GraphNode
        .find({owner: me.id})
        .populate('target', 'fullName password')
        .exec(function(err, nodes) {
            if (err) { return res.send(500, {error: err}); }

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
                fullName: me.fullName,
                id: me.id,
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
                .or([{sources: me.id}, {targets: me.id}])
                .exec(function(err, links) {

                    // We need to map these activity links, and transform them into a 2d
                    // structure that maps source/target pairs to counts.
                    var counts = {};
                    _.each(links, function(l) {
                        _.each(l.sources, function(s) {
                            _.each(l.targets, function(t) {
                                counts[s] = counts[s] || {};
                                counts[s][t] = (counts[s][t] || 0) + 1;
                            });
                        });
                    });

                    var countsAsList = _.map(counts, function(cc, s) {
                        return _.map(cc, function(c, t) {
                            return {source: s, target: t, numActivities: c};
                        });
                    });
                    countsAsList = _.flatten(countsAsList);

                    // Finally, we promote some 'maybe's to 'baby' state if they have activities
                    _.each(countsAsList, function(c) {
                        if (nodes[c.source].type === 'maybe') {
                            nodes[c.source].type = 'baby';
                        }
                        if (nodes[c.target].type === 'maybe') {
                            nodes[c.target].type = 'baby';
                        }
                    });

                    res.send({
                        nodes: nodes,
                        links: countsAsList
                    });
                })
            ;
        })
    ;
};

exports.update = function(req, res){
    res.send({ status: 'OK' });
};
