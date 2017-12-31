/**
 * A spec for the Product model
 */

'use strict';

var db = require('../../app/models');

describe('A product', function() {
    it('has a getDefaultSorting static method', function() {
        expect(typeof db.Product.getDefaultSorting).toBe('function', 'method exists');
        expect(db.Product.getDefaultSorting()).toEqual([
            ['isAvailable', 'DESC'],
            ['ratingRank', 'DESC'],
            ['ratingCount', 'DESC'],
            ['name', 'ASC']
        ], 'returns correct sorting');
    });
});
