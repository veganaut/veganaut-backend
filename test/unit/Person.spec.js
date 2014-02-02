/**
 * A spec for the Person model
 */

'use strict';

var Person = require('../../models/Person');

describe('A person', function() {
    it('can be created', function() {
        var p = new Person({email: 'foo@bar.baz'});
        expect(p.email).toBe('foo@bar.baz');
        expect(p.id).toBeTruthy();
        expect(p.alienName).toMatch(/Zorg-\d+/);
    });
});
