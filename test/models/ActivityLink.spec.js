/**
 * A spec for the ActivityLink model
 */

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
require('../../app/models/ActivityLink');
var ActivityLink = mongoose.model('ActivityLink');

describe('An activity link', function() {
    it('can generate memorable reference codes', function() {
        var referenceCodes = [];
        for (var i = 0; i < 100; ++i) {
            var al = new ActivityLink();
            expect(al.referenceCode).toMatch(/(?:[a-z][aeiou]){5}/);
            referenceCodes.push(al.referenceCode);
        }

        // Verify that reference codes are unique (which they should be if they
        // are random, even without saving the objects to the database)
        expect(_.every(_.groupBy(referenceCodes), function(group) { return group.length === 1; })).toBe(true);
    });
});
