'use strict';
/* global describe, it, beforeAll, afterAll, runs, waitsFor, expect */

var h = require('../helpers');

describe('Our API', function() {

    //TODO require auth?
    it('can get me', function() {
        h.runAsync(function(done) {
            h.request.get(h.baseURL + 'graph/me').end(function(res) {
                expect(res.statusCode).toBe(200);

                // Make sure there is an array nodes and links
                expect(typeof res.body.nodes).toEqual('object');
                expect(typeof res.body.nodes.length).toEqual('number');
                expect(typeof res.body.links).toEqual('object');
                expect(typeof res.body.links.length).toEqual('number');
                done();
            });
        });
    });

    it('can update the graph', function() {
        h.runAsync(function(done) {
            h.request.put(h.baseURL + 'graph').end(function(res) {
                //TODO define behavior here
                expect(res.statusCode).toBe(200);
                expect(res.body.status).toEqual('OK');
                done();
            });
        });
    });

});
