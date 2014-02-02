/**
 * Test helpers
 */

'use strict';

require('jasmine-before-all');
exports.beforeAll = beforeAll;
exports.afterAll = afterAll;

var superagentDefaults = require('superagent-defaults');
exports.request = superagentDefaults();

// Set the port to 3001 for testing, so we can run this while having express
// running on its default port 3000
process.env.PORT = 3001;

exports.baseURL = 'http://localhost:' + process.env.PORT + '/';

exports.runAsync = function(block) {
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
};

