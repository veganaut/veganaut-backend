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
                    //expect(node.role).toMatch(/^(rookie|scout|veteran|)$/, 'role is one of rookie,scout or veteran'); can be undefined
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
                        expect('unkown node type').toBe('never happening', 'relation is one of me,friend or friendOfFriend');
                    }
                });

                // TODO: check that not too much information is exposed (no names or num activity infos for friends of friends)
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
