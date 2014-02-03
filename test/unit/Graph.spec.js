'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

h.describe('Our API', function() {

    it('can get me', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'graph/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                // Make sure we get nodes and links
                expect(typeof res.body.nodes).toEqual('object');
                expect(typeof res.body.links).toEqual('object');
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
