'use strict';

var _ = require('lodash');
var h = require('../helpers_');


h.describe('Location API methods as logged in user alice.', function() {
    it('can create a new location', function(done) {
        h.request('POST', h.baseURL + 'location')
            .send({
                name: 'Tingelkringel',
                lat: 46,
                lng: 7,
                type: 'gastronomy'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var location = res.body;
                expect(location.name).toBe('Tingelkringel', 'set correct name');
                expect(location.lat).toBe(46, 'set correct lat');
                expect(location.lng).toBe(7, 'set correct lng');
                expect(location.type).toBe('gastronomy', 'set correct type');
                expect(typeof location.id).toBe('number', 'has an id');
                expect(typeof location.quality).toBe('object', 'has a quality');
                expect(location.quality.average).toBe(0, 'quality is at 0 by default');
                expect(location.quality.numRatings).toBe(0, 'quality numRatings is at 0 by default');

                // Check that it got the address from the Nominatim mock
                expect(typeof location.address).toBe('object', 'got address object');
                expect(location.address.street).toBe('Bundesplatz', 'got street');
                expect(location.address.house).toBe('1', 'got house');
                expect(location.address.postcode).toBe('3005', 'got postcode');
                expect(location.address.city).toBe('Bern', 'got city');
                expect(location.address.country).toBe('Switzerland', 'got country');
                expect(Object.keys(location.address).length).toBe(5, 'got correct amount of address details');

                done();
            })
        ;
    });

    it('can list locations', function(done) {
        h.request('GET', h.baseURL + 'location/list')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(res.body.totalLocations).toBe(5, 'returns correct total locations');
                expect(Object.keys(res.body).length).toBe(2, 'returns nothing else');
                expect(res.body.locations.length).toBe(5, '5 locations (4 from fixtures, one from previous test)');

                _.each(res.body.locations, function(location) {
                    expect(Object.keys(location).length).toBe(6, 'number of properties exposed of location');
                    expect(typeof location.id).toBe('number', 'has an id');
                    expect(typeof location.name).toBe('string', 'has a name');
                    expect(typeof location.lat).toBe('number', 'has lat');
                    expect(typeof location.lng).toBe('number', 'has lng');
                    expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');

                    expect(typeof location.points).toBe('undefined', 'points are not set');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    expect(typeof location.effort).toBe('undefined', 'effort not exposed');
                    expect(typeof location.tags).toBe('undefined', 'tags are not set');
                    expect(typeof location.address).toBe('undefined', 'address is not set');
                });
                done();
            })
        ;
    });

    it('can list locations within a bounding box with address', function(done) {
        h.request(h.baseURL + 'location/list?bounds=7.436,46.943,7.442,46.950&addressType=street')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(res.body.totalLocations).toBe(1, 'returns correct total locations');
                expect(res.body.locations.length).toBe(1, 'returns only the location in the bounding box');

                var location = res.body.locations[0];
                expect(location.name).toBe('Reformhaus Ruprecht', 'returned the correct location');
                expect(typeof location.address).toBe('object', 'has an address');
                expect(Object.keys(location.address).length).toBe(2, 'number of address properties exposed');
                expect(location.address.street).toBe('Christoffelgasse', 'correct street');
                expect(location.address.house).toBe('7', 'correct house number');

                done();
            })
        ;
    });

    it('can list locations within a radius around a center with address', function(done) {
        h.request(h.baseURL + 'location/list?lat=46.956&lng=7.452&radius=150&addressType=city')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(res.body.totalLocations).toBe(1, 'returns correct total locations');
                expect(res.body.locations.length).toBe(1, 'returns only the location within the radius');

                var location = res.body.locations[0];
                expect(location.name).toBe('3dosha', 'returned the correct location');
                expect(typeof location.address).toBe('object', 'has an address');
                expect(Object.keys(location.address).length).toBe(1, 'number of address properties exposed');
                expect(location.address.city).toBe('Bern', 'correct city');

                done();
            })
        ;
    });

    it('can list locations and cluster them', function(done) {
        h.request('GET', h.baseURL + 'location/list?bounds=7.337,46.851,7.557,47.076&clusterLevel=11')
            .end(function(err, res) {

                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(_.isArray(res.body.clusters)).toBe(true, 'returns an array of clusters');
                expect(res.body.totalLocations).toBe(4, 'returns correct total locations');
                expect(Object.keys(res.body).length).toBe(3, 'returns nothing else');
                expect(res.body.locations.length).toBe(2, 'returns 2 locations');
                expect(res.body.clusters.length).toBe(3, 'returns 3 clusters');

                var totalLocations = 0;
                _.each(res.body.clusters, function(cluster) {
                    expect(Object.keys(cluster).length).toBe(5, 'number of properties exposed of cluster');
                    expect(typeof cluster.id).toBe('string', 'has an id');
                    expect(typeof cluster.lat).toBe('number', 'has lat');
                    expect(typeof cluster.lng).toBe('number', 'has lng');
                    expect(cluster.clusterSize).toBeGreaterThan(-1, 'has a valid cluster size');
                    totalLocations += cluster.clusterSize;
                    expect(['tiny', 'small', 'medium', 'large'].indexOf(cluster.sizeName))
                        .toBeGreaterThan(-1, 'has a valid cluster size name')
                    ;
                });

                expect(totalLocations).toBe(4, 'has all locations in clusters');

                // Test that we own some location in a certain cluster
                var ownedCluster = _.findWhere(res.body.clusters, { id: '31000212130021' });
                expect(_.isPlainObject(ownedCluster)).toBe(true, 'found cluster where user is owner');

                done();
            })
        ;
    });

    it('can get an individual location with products', function(done) {
        h.request('GET', h.baseURL + 'location/6')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var location = res.body;
                expect(typeof location).toBe('object', 'response is an object');
                expect(location.id).toBe(6, 'correct location id');
                expect(location.name).toBe('3dosha', 'correct name');
                expect(typeof location.type).toBe('string', 'got a type');
                expect(typeof location.updatedAt).toMatch('string', 'updatedAt is a string');
                var updatedAt = new Date(location.updatedAt);
                expect(isNaN(updatedAt.getTime())).toBe(false,
                    'updatedAt can be parsed as a valid date'
                );

                expect(typeof location.products).toBe('object', 'got an array of products');
                expect(typeof location.quality).toBe('object', 'has a quality');
                expect(typeof location.quality.average).toBe('number', 'has a quality average');
                expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                expect(typeof location.tags).toBe('object', 'got tags object');
                expect(typeof location.address).toBe('object', 'got address object');
                expect(typeof location.address.street).toBe('string', 'got street');
                expect(typeof location.address.house).toBe('string', 'got house');
                expect(typeof location.address.postcode).toBe('string', 'got postcode');
                expect(typeof location.address.city).toBe('string', 'got city');
                expect(typeof location.address.country).toBe('string', 'got country');
                expect(Object.keys(location.address).length).toBe(5, 'got correct amount of address details');
                expect(location.products.length).toBeGreaterThan(0, 'got some products');

                // Expected order: samosa should be before curry because curry is temporarilyUnavailable
                var expectedOrder = ['samosa', 'curry'];
                var expectedAvailabilities = ['always', 'not'];
                _.each(location.products, function(product, index) {
                    expect(typeof product.name).toBe('string', 'has a name');
                    expect(product.name).toBe(expectedOrder[index], 'correct name (meaning correct order)');
                    expect(typeof product.id).toBe('number', 'has an id');
                    expect(typeof product.location).toBe('undefined', 'location is not sent again');
                    expect(typeof product.availability).toBe('string', 'has an availability');
                    expect(product.availability).toBe(expectedAvailabilities[index], 'correct availability');
                });

                done();
            })
        ;
    });

    it('can get an individual location with tags', function(done) {
        h.request('GET', h.baseURL + 'location/8')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var location = res.body;
                expect(typeof location).toBe('object', 'response is an object');
                expect(location.id).toBe(8, 'correct location id');
                expect(location.name).toBe('Kremoby Hollow', 'correct name');

                expect(typeof location.tags).toBe('object', 'got tags object');
                expect(Object.keys(location.tags).length).toBe(5, 'got correct amount of tags');

                _.each(location.tags, function(count, tag) {
                    expect(typeof tag).toBe('string', 'got a tag name');
                    expect(typeof count).toBe('number', 'got a count');
                    expect(count).toBeGreaterThan(0, 'correct count');
                });

                done();
            })
        ;
    });

    it('get suggested task at ruprecht', function(done) {
        h.request('GET', h.baseURL + 'location/7/suggestedTask')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var suggested = res.body;
                expect(_.isArray(suggested)).toBe(true, 'got an array');
                expect(suggested.length).toBe(3, 'got right number of tasks');
                _.each(suggested, function(task) {
                    expect(typeof task).toBe('string', 'task comes as string');
                    // TODO: test more!
                });

                done();
            })
        ;
    });

    it('get suggested task at hollow', function(done) {
        h.request('GET', h.baseURL + 'location/8/suggestedTask')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var suggested = res.body;
                expect(_.isArray(suggested)).toBe(true, 'got an array');
                expect(suggested.length).toBe(3, 'got right number of tasks');
                _.each(suggested, function(task) {
                    expect(typeof task).toBe('string', 'task comes as string');
                    // TODO: test more!
                });

                done();
            })
        ;
    });

    it('returns 404 for location that does not exist', function(done) {
        h.request('GET', h.baseURL + 'location/99999')
            .end(function(err, res) {
                expect(res.statusCode).toBe(404);
                expect(typeof res.body.error).toBe('string', 'got an error message');
                done();
            })
        ;
    });

    it('cannot update a location directly', function(done) {
        h.request('PUT', h.baseURL + 'location/6')
            .send({})
            .end(function(err, res) {
                expect(res.statusCode).toBe(404, 'method should not exist');
                done();
            })
        ;
    });
});


h.describe('Location API methods when not logged in.', {user: ''}, function() {
    it('can list locations', function(done) {
        h.request('GET', h.baseURL + 'location/list')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(res.body.totalLocations).toBe(4, 'returns correct total locations');
                expect(Object.keys(res.body).length).toBe(2, 'returns nothing else');
                expect(res.body.locations.length).toBe(4, 'has 4 locations');

                _.each(res.body.locations, function(location) {
                    expect(Object.keys(location).length).toBe(6, 'number of properties exposed of location');
                    expect(typeof location.id).toBe('number', 'has an id');
                    expect(typeof location.name).toBe('string', 'has a name');
                    expect(typeof location.lat).toBe('number', 'has lat');
                    expect(typeof location.lng).toBe('number', 'has lng');
                    expect(location.type).toMatch(/^(gastronomy|retail)$/, 'type is gastronomy or retail');

                    expect(typeof location.points).toBe('undefined', 'points are not set');
                    expect(typeof location.quality).toBe('object', 'has a quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    expect(typeof location.tags).toBe('undefined', 'tags are not set');
                    expect(typeof location.address).toBe('undefined', 'address is not set');
                });
                done();
            })
        ;
    });

    it('can list locations with limit and skip', function(done) {
        h.request('GET', h.baseURL + 'location/list?limit=2&skip=1')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(res.body.totalLocations).toBe(4, 'returns correct total locations');
                expect(Object.keys(res.body).length).toBe(2, 'returns nothing else');
                expect(res.body.locations.length).toBe(2, 'limits to 2 locations');

                // This tests the sorting and the skip at the same time
                expect(res.body.locations[0].name).toBe('Reformhaus Ruprecht', 'correct location 1');
                expect(res.body.locations[1].name).toBe('3dosha', 'correct location 2');
                done();
            })
        ;
    });

    it('can list locations and cluster them', function(done) {
        h.request('GET', h.baseURL + 'location/list?bounds=7.337,46.851,7.557,47.076&clusterLevel=11')
            .end(function(err, res) {

                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(_.isArray(res.body.clusters)).toBe(true, 'returns an array of clusters');
                expect(res.body.totalLocations).toBe(4, 'returns correct total locations');
                expect(Object.keys(res.body).length).toBe(3, 'returns nothing else');
                expect(res.body.locations.length).toBe(2, 'returns 2 locations');
                expect(res.body.clusters.length).toBe(3, 'returns 3 clusters');

                var totalLocations = 0;
                _.each(res.body.clusters, function(cluster) {
                    expect(Object.keys(cluster).length).toBe(5, 'number of properties exposed of cluster');
                    expect(typeof cluster.id).toBe('string', 'has an id');
                    expect(typeof cluster.lat).toBe('number', 'has lat');
                    expect(typeof cluster.lng).toBe('number', 'has lng');
                    expect(cluster.clusterSize).toBeGreaterThan(-1, 'has a valid cluster size');
                    totalLocations += cluster.clusterSize;
                    expect(['tiny', 'small', 'medium', 'large'].indexOf(cluster.sizeName))
                        .toBeGreaterThan(-1, 'has a valid cluster size name')
                    ;
                    expect(typeof cluster.numOwned).toBe('undefined', 'numOwned not given if not logged in');
                });

                expect(totalLocations).toBe(4, 'has all locations in clusters');

                done();
            })
        ;
    });

    it('can filter locations by type', function(done) {
        h.request('GET', h.baseURL + 'location/list?type=gastronomy')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                expect(res.body.totalLocations).toBe(2, 'returns correct total locations');
                expect(Object.keys(res.body).length).toBe(2, 'returns nothing else');
                expect(res.body.locations.length).toBe(2, 'has 2 gastronomy locations');

                _.each(res.body.locations, function(location) {
                    expect(location.type).toBe('gastronomy', 'returned gastronomy location');
                });
                done();
            })
        ;
    });

    it('can filter locations by update time', function(done) {
        // TODO: find a better way to test this
        setTimeout(function() {
            h.request('GET', h.baseURL + 'location/list?updatedWithin=1')
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200);
                    expect(_.isPlainObject(res.body)).toBe(true, 'returns a plain object');
                    expect(_.isArray(res.body.locations)).toBe(true, 'returns an array of locations');
                    expect(res.body.totalLocations).toBe(0, 'returns correct total locations');
                    expect(Object.keys(res.body).length).toBe(2, 'returns nothing else');
                    expect(res.body.locations.length).toBe(0, 'has no location changed less than a second ago');
                    done();
                })
            ;
        }, 1000);
    });

    it('can get an individual location', function(done) {
        h.request('GET', h.baseURL + 'location/6')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var location = res.body;
                expect(typeof location).toBe('object', 'response is an object');
                expect(location.id).toBe(6, 'correct location id');
                expect(location.name).toBe('3dosha', 'correct name');
                expect(typeof location.type).toBe('string', 'got a type');
                expect(typeof location.quality).toBe('object', 'has a quality');
                expect(typeof location.quality.average).toBe('number', 'has a quality average');
                expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                expect(typeof location.tags).toBe('object', 'got tags object');
                expect(typeof location.products).toBe('object', 'got an array of products');
                expect(location.products.length).toBeGreaterThan(0, 'got some products');
                expect(typeof location.address).toBe('object', 'address is set');
                expect(Object.keys(location.address).length).toBe(5, 'number of address properties exposed');

                _.each(location.products, function(product) {
                    expect(typeof product.name).toBe('string', 'has a name');
                    expect(typeof product.id).toBe('number', 'has an id');
                    expect(typeof product.rating).toBe('object', 'has a rating');
                    expect(typeof product.rating.average).toBe('number', 'has a rating average');
                    expect(typeof product.rating.numRatings).toBe('number', 'has a rating amount');
                    expect(typeof product.location).toBe('undefined', 'location is not sent again');
                    expect(typeof product.availability).toBe('string', 'has an availability');
                });

                done();
            })
        ;
    });

    it('does not return deleted locations', function(done) {
        h.request('GET', h.baseURL + 'location/11')
            .end(function(err, res) {
                expect(res.statusCode).toBe(404);
                expect(typeof res.body.error).toBe('string', 'got an error message');
                done();
            })
        ;
    });

    it('can search for locations', function(done) {
        h.request('GET', h.baseURL + 'location/search?query=shop')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                var locations = res.body;
                expect(_.isArray(locations)).toBe(true, 'got an array');
                expect(locations.length).toBeGreaterThan(1, 'got more than one result');

                // TODO WIP: check that the result with "Shop" in the name is first
                _.each(locations, function(location) {
                    expect(Object.keys(location).length).toBe(5, 'number of properties exposed of location');
                    expect(typeof location.id).toBe('number', 'has an id');
                    expect(typeof location.name).toBe('string', 'has a name');
                    expect(typeof location.type).toBe('string', 'has type');
                    expect(typeof location.quality).toBe('object', 'has quality');
                    expect(typeof location.quality.average).toBe('number', 'has a quality average');
                    expect(typeof location.quality.numRatings).toBe('number', 'has a quality rating amount');
                    expect(typeof location.address).toBe('object', 'has an address');
                    expect(Object.keys(location.address).length).toBe(1, 'number of properties exposed of address');
                    expect(typeof location.address.city).toBe('string', 'has a city in the address');
                });
                done();
            })
        ;
    });

    it('can limit number of results when searching for locations', function(done) {
        h.request('GET', h.baseURL + 'location/search?query=shop&limit=1')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);
                expect(res.body.length).toBe(1, 'got one result');
                done();
            })
        ;
    });

    it('checks for valid search string when searching', function(done) {
        h.request('GET', h.baseURL + 'location/search')
            .end(function(err, res) {
                expect(res.statusCode).toBe(400);
                done();
            })
        ;
    });
});
