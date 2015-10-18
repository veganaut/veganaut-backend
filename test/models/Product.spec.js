/**
 * A spec for the Product model
 */

'use strict';

var Product = require('../../app/models/Product');

describe('A product', function() {
    it('has a getDefaultSorting static method', function() {
        expect(typeof Product.getDefaultSorting).toBe('function', 'method exists');
        expect(Product.getDefaultSorting()).toBe('-availability -rating.rank -rating.count name', 'returns correct sorting');
    });
});
