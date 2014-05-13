'use strict';
/* global it, expect */

var _ = require('lodash');
var h = require('../helpers');

h.describe('Graph API methods', function() {
    it('can get me', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'graph/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                // Make sure we get nodes and links
                expect(_.isPlainObject(res.body.nodes)).toBe(true, 'nodes is an object');
                expect(_.isArray(res.body.links)).toBe(true, 'links is an array');

                // Check that there's the right amount of nodes and links
                var nodeKeys = Object.keys(res.body.nodes);
                expect(nodeKeys.length).toBe(5, 'number of nodes in graph');
                expect(res.body.links.length).toBe(4, 'number of links in graph');

                // Validate all the nodes
                nodeKeys.forEach(function(id) {
                    var node = res.body.nodes[id];

                    expect(typeof node.id).toBe('string', 'id is string');
                    expect(typeof node.nickName).toBe('string', 'nickName is string');
                    expect(typeof node.type).toBe('string', 'type is string');
                    expect(node.type).toMatch(/^(user|baby|maybe)$/, 'type is one of user,baby or maybe');
                    //expect(typeof node.team).toBe('string', 'team is a string');  can be undefined
                    expect(node.role).toMatch(/^(rookie|scout|veteran|)$/, 'role is one of rookie,scout or veteran');
                    expect(typeof node.strength).toBe('number', 'strength is a number');
                    expect(node.strength).toBeGreaterThan(-1, '... and positive');
                    expect(typeof node.hits).toBe('number', 'hits is a number');
                    expect(node.hits).toBeGreaterThan(-1, '... and positive');
                    expect(typeof node.isCaptured).toBe('boolean', 'isCaptured is a boolean');
                    expect(typeof node.relation).toBe('string', 'relation is a string');
                    switch (node.relation) {
                    case 'me':
                        expect(typeof node.fullName).toBe('string', 'fullName of me is set');
                        expect(typeof node.coordX).toBe('number', 'coordX of me is set');
                        expect(typeof node.coordY).toBe('number', 'coordY of me is set');
                        break;
                    case 'friend':
                        expect(typeof node.fullName).toBe('string', 'fullName of friends is set');
                        break;
                    case 'friendOfFriend':
                        expect(node.fullName).toBeUndefined('fullName of friendsOfFriends is *not* set');
                        break;
                    default:
                        expect('unknown node type').toBe('never happening', 'relation is one of me, friend or friendOfFriend');
                    }
                });

                _.each(res.body.links, function(link) {
                    expect(typeof link.source).toBe('string', 'source is a string');
                    expect(typeof link.target).toBe('string', 'target is a string');
                    expect(typeof link.openActivities).toBe('number', 'openActivities is a number');
                    expect(typeof link.completedActivities).toBe('number', 'completedActivities is a number');
                });

                done();
            });
        });
    });

    it('cannot get graph of a full user if not logged in as that user', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'graph/000000000000000000000001').end(function(res) {
                expect(res.statusCode).toBe(403);
                done();
            });
        }) ;
    });

    it('can get graph of a maybe user', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'graph/000000000000000000000003').end(function(res) {
                expect(res.statusCode).toBe(200);

                expect(typeof res.body.nodes).toEqual('object');
                expect(typeof res.body.links).toEqual('object');
                expect(Object.keys(res.body.nodes).length).toBe(4); // 1 me, 1 the other use, 2 friends of that friend
                expect(res.body.links.length).toBe(3);
                done();
            });
        });
    });
});

// TODO: test more wrong inputs
// TODO: test against partial updates
h.describe('Graph API update', function () {
    it('can update coordinates for my graph', function () {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'graph/me')
                .send({
                    nodes: {
                        '000000000000000000000001' : {id: '000000000000000000000001', coordX: 1.1, coordY: 1.2},
                        '000000000000000000000002' : {id: '000000000000000000000002', coordX: 2.1, coordY: 2.2},
                        '000000000000000000000003' : {id: '000000000000000000000003', coordX: 3.1, coordY: 3.2},
                        '000000000000000000000004' : {id: '000000000000000000000004', coordX: 4.1, coordY: 4.2},
                        '000000000000000000000005' : {id: '000000000000000000000005', coordX: 5.1, coordY: 5.2}
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    h.request('GET', h.baseURL + 'graph/me').end(function(res) {
                        expect(res.statusCode).toBe(200);

                        // Make sure we get nodes and links
                        expect(_.isPlainObject(res.body.nodes)).toBe(true, 'nodes is an object');
                        expect(_.isArray(res.body.links)).toBe(true, 'links is an array');

                        // Check that there's the right amount of nodes and links
                        var nodeKeys = Object.keys(res.body.nodes);
                        expect(nodeKeys.length).toBe(5, 'number of nodes in graph');
                        expect(res.body.links.length).toBe(4, 'number of links in graph');

                        // Validate all the nodes
                        nodeKeys.forEach(function(id) {
                            var node = res.body.nodes[id];
                            var num = _.parseInt(id);
                            if (node.relation === 'me') {
                                expect(node.coordX).toBe(0.5, 'can not overwrite my coordinates');
                                expect(node.coordY).toBe(0.5, 'can not overwrite my coordinates');
                            } else {
                                expect(node.coordX).toBe(num + 0.1, 'returns updated coordinates');
                                expect(node.coordY).toBe(num + 0.2, 'returns updated coordinates');
                            }
                        });

                        done();
                    });
                });
        });
    });

    it('does not accept update with missing id', function () {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'graph/me')
                .send({
                    nodes: {
                        '000000000000000000000001' : {id: '000000000000000000000001', coordX: 1.1, coordY: 1.2},
                        '000000000000000000000002' : {coordX: 2.1, coordY: 2.2},
                        '000000000000000000000003' : {id: '000000000000000000000003', coordX: 3.1, coordY: 3.2},
                        '000000000000000000000004' : {id: '000000000000000000000004', coordX: 4.1, coordY: 4.2},
                        '000000000000000000000005' : {id: '000000000000000000000005', coordX: 5.1, coordY: 5.2}
                    }
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(400);
                    done();
                });
        });
    });
});

h.describe('Graph API methods for new user', {fixtures: 'extended', user: 'nova@example.com'}, function() {
    it('can get me if I\'m a new user', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'graph/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                // Make sure we get nodes and links
                expect(_.isPlainObject(res.body.nodes)).toBe(true);
                expect(_.isArray(res.body.links)).toBe(true);

                // Check that there's the right amount of nodes and links
                var nodeKeys = Object.keys(res.body.nodes);
                expect(nodeKeys.length).toBe(1);
                expect(res.body.links.length).toBe(0);

                var alice = _.values(res.body.nodes)[0];
                expect(alice.fullName).toBe('Nova Example');
                expect(alice.relation).toBe('me');
                done();
            });
        });
    });
});
