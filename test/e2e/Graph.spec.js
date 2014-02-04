'use strict';
/* global it, expect */

var h = require('../helpers');

h.describe('Graph API methods', function() {

    it('can get me', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'graph/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                // Make sure we get nodes and links
                expect(typeof res.body.nodes).toEqual('object');
                expect(typeof res.body.links).toEqual('object');

                // Check that there's the right amount of nodes and links
                expect(Object.keys(res.body.nodes).length).toBe(2);
                expect(res.body.links.length).toBe(1);
                done();
            });
        });
    });

    it('can update the graph', function() {
        h.runAsync(function(done) {
            h.request('PUT', h.baseURL + 'graph').end(function(res) {
                //TODO define behavior here
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

});
