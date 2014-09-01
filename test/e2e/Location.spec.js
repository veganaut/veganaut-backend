'use strict';
/* global it, expect */

var _ = require('lodash');
var h = require('../helpers_');

// TODO: this seems to complicated to be in a test
// Helper values for the nextVisitBonusDate
var afterHowLongAgain = 3 * 7 * 24 * 60 * 60 * 1000; // Three weeks
var expectedBonusDates = {
    '3dosha': new Date(),
    'Reformhaus Ruprecht': new Date((new Date('2014-08-25')).getTime() + afterHowLongAgain),
    'Kremoby Hollow': new Date((new Date('2014-08-10')).getTime() + afterHowLongAgain),
    'Tingelkringel': new Date()
};

h.describe('Location API methods', function() {
    it('can create a new location', function() {
        h.runAsync(function(done) {
            h.request('POST', h.baseURL + 'location')
                .send({
                    name: 'Tingelkringel',
                    lat: 46.951081,
                    lng: 7.438637,
                    type: 'gastronomy'
                })
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    done();
                })
            ;
        });
    });

    it('can list locations', function() {
        h.runAsync(function(done) {
            h.request('GET', h.baseURL + 'location/list')
                .end(function(res) {
                    expect(res.statusCode).toBe(200);
                    expect(typeof res.body).toBe('object', 'returns an array of locations');
                    expect(res.body.length).toBe(4, '4 locations (3 from fixtures, one from previous test)');

                    _.each(res.body, function(location) {
                        expect(typeof location.name).toBe('string', 'has a name');
                        expect(typeof location.lat).toBe('number', 'has lat');
                        expect(typeof location.lng).toBe('number', 'has lng');
                        expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');
                        expect(typeof location.nextVisitBonusDate).toMatch('string', 'nextVisitBonusDate is a string');
                        var nextVisitBonusDate = new Date(location.nextVisitBonusDate);
                        expect(isNaN(nextVisitBonusDate.getTime())).toBe(false,
                            'nextVisitBonusDate can be parsed as a valid date'
                        );
                        expect(Math.abs(nextVisitBonusDate - expectedBonusDates[location.name])).toBeLessThan(60000,
                            'correctly calculated nextVisitBonusDate for ' + location.name +
                            '\nis:       ' + nextVisitBonusDate +
                            '\nexpected: ' + expectedBonusDates[location.name]
                        );

                        expect(location.team).toMatch(/^(blue|green)$/, 'team is blue or green');
                        expect(typeof location.points).toBe('object', 'points is an object');

                        // TODO: should we test the exact points?
                    });
                    done();
                })
            ;
        });
    });
});
