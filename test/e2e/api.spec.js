'use strict';
/* global describe, it, beforeAll, runs, waitsFor */
require('jasmine-before-all');
var superagentDefaults = require('superagent-defaults');

var request = superagentDefaults();

var baseURL = 'http://localhost:3000/';

// Shamelessly copied from https://github.com/derickbailey/jasmine.async
function runAsync(block) {
    var done = false;
    var complete = function() {
        done = true;
    };

    runs(function(){
        block(complete);
    });

    waitsFor(function(){
        return done;
    });
}

describe('API', function() {

    describe('first test', function() {
        it('tests something', function() {

            runAsync(function(done) {
                console.log('started async test');
                setTimeout(function () {
                    console.log('ended async test');
                    done();
                }, 10);
            });
        });
    });
});
