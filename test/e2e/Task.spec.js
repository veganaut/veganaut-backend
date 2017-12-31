'use strict';

var _ = require('lodash');
var h = require('../helpers_');
var FixtureCreator = require('../fixtures/FixtureCreator');

var fix = new FixtureCreator();
fix
    .user('alice')
    .location('alice', 'Tingelkringel', [10, 20], 'retail')
;

var locationId = fix.getFixtures()['Tingelkringel'].id;

// TODO: test all tasks on a location that already has many values set

h.describe('Basic functionality of task API methods.', {fixtures: fix, user: 'alice@example.com'}, function() {
    it('can submit a SetLocationName task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationName',
                outcome: {
                    name: 'Kringel'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(typeof task.id).toBe('number', 'id is a string');
                expect(typeof task.person).toBe('number', 'person is a number');
                expect(typeof task.location).toBe('number', 'location is a number');
                expect(typeof task.createdAt).toBe('string', 'completed is a string');
                expect(task.type).toBe('SetLocationName', 'type is correct');
                expect(typeof task.outcome).toBe('object', 'outcome of the task');
                expect(task.outcome.name).toBe('Kringel', 'outcome of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.name).toBe('Kringel', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit a SetLocationType task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationType',
                outcome: {
                    locationType: 'gastronomy'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationType', 'type is correct');
                expect(task.outcome.locationType).toBe('gastronomy', 'outcome of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.type).toBe('gastronomy', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit a SetLocationDescription task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationDescription',
                outcome: {
                    description: 'Bagels and donuts'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationDescription', 'type is correct');
                expect(task.outcome.description).toBe('Bagels and donuts', 'outcome of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.description).toBe('Bagels and donuts', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit a SetLocationCoordinates task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationCoordinates',
                outcome: {
                    latitude: 33.5,
                    longitude: 8.13
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationCoordinates', 'type is correct');
                expect(task.outcome.latitude).toBe(33.5, 'outcome 1 of the task');
                expect(task.outcome.longitude).toBe(8.13, 'outcome 2 of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.lat).toBe(33.5, '1 updated location');
                        expect(res.body.lng).toBe(8.13, '2 updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit a SetLocationWebsite task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationWebsite',
                outcome: {
                    website: 'https://tingel.example.com',
                    isAvailable: true
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationWebsite', 'type is correct');
                expect(task.outcome.website).toBe('https://tingel.example.com', 'outcome 1 of the task');
                expect(task.outcome.isAvailable).toBe(true, 'outcome 2 of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.website).toBe('https://tingel.example.com', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit a SetLocationExistence task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationExistence',
                outcome: {
                    existence: 'closedDown'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationExistence', 'type is correct');
                expect(task.outcome.existence).toBe('closedDown', 'outcome of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.existence).toBe('closedDown', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit HaveYouBeenHereRecently task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'HaveYouBeenHereRecently',
                outcome: {
                    beenHere: 'yes'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('HaveYouBeenHereRecently', 'type of task');
                expect(res.body.outcome.beenHere).toEqual('yes', 'outcome beenHere');
                done();
            })
        ;
    });

    it('can submit MentionVegan task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'MentionVegan',
                outcome: {
                    commitment: 'maybe',
                    notes: 'I might ask for vegan lunch'
                }
            })
            .end(function(err, res) {
                // TODO WIP: this task doesn't do anything yet
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('MentionVegan', 'type of task');
                expect(res.body.outcome.commitment).toEqual('maybe', 'outcome commitment');
                expect(res.body.outcome.notes).toEqual('I might ask for vegan lunch', 'outcome notes');
                done();
            })
        ;
    });

    it('can submit AddProduct task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'AddProduct',
                outcome: {
                    productAdded: true,
                    name: 'Smoothie'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('AddProduct', 'type of mission');
                expect(res.body.outcome.productAdded).toEqual(true, 'productAdded outcome');
                expect(res.body.outcome.name).toEqual('Smoothie', 'name outcome');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.products.length).toBe(1, 'should now have one product');
                        var smoothie = res.body.products[0];
                        expect(smoothie.name).toBe('Smoothie', 'product name');
                        expect(smoothie.availability).toBe('always', 'default availability');
                        expect(smoothie.rating.average).toBe(0, 'avg rating');
                        expect(smoothie.rating.numRatings).toBe(0, 'numRatings');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit a SetLocationProductListComplete task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'SetLocationProductListComplete',
                outcome: {
                    completionState: 'incompleteGoodSummary'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationProductListComplete', 'type is correct');
                expect(task.outcome.completionState).toBe('incompleteGoodSummary', 'outcome of the task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.productListComplete).toBe('incompleteGoodSummary', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('can submit GiveFeedback task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'GiveFeedback',
                outcome: {
                    commitment: 'yes',
                    notes: 'Moar sauce'
                }
            })
            .end(function(err, res) {
                // TODO WIP: this task doesn't do anything yet
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('GiveFeedback', 'type of task');
                expect(res.body.outcome.commitment).toEqual('yes', 'outcome commitment');
                expect(res.body.outcome.notes).toEqual('Moar sauce', 'outcome notes');
                done();
            })
        ;
    });

    it('can submit RateLocationQuality task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'RateLocationQuality',
                outcome: {
                    quality: 4
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('RateLocationQuality', 'type of task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        expect(res.body.quality.average).toBe(4, 'added rating to average');
                        expect(res.body.quality.numRatings).toBe(1, 'added rating to count');

                        // Submit again to verify it replaces the rating
                        h.request('POST', h.baseURL + 'task')
                            .send({
                                location: locationId,
                                type: 'RateLocationQuality',
                                outcome: {
                                    quality: 2
                                }
                            })
                            .end(function() {
                                h.request('GET', h.baseURL + 'location/' + locationId)
                                    .end(function(err, res) {
                                        expect(res.body.quality.average).toBe(2, 'replaced rating average');
                                        expect(res.body.quality.numRatings).toBe(1, 'did not increase the count');
                                        done();
                                    })
                                ;
                            })
                        ;
                    })
                ;
            })
        ;
    });

    it('can submit TagLocation task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'TagLocation',
                outcome: {
                    tags: [
                        'rfDairy',
                        'rfBread',
                        'rfSweets',
                        'rfMeat'
                    ]
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('TagLocation', 'type of task');

                h.request('GET', h.baseURL + 'location/' + locationId)
                    .end(function(err, res) {
                        var tags = res.body.tags;
                        expect(Object.keys(tags).length).toBe(4, 'has the correct number of tags');
                        expect(tags.rfDairy).toBe(1, 'gBreakfast count');
                        expect(tags.rfBread).toBe(1, 'gDinner count');
                        expect(tags.rfSweets).toBe(1, 'gSweets count');
                        expect(tags.rfMeat).toBe(1, 'gSnacks count');
                        done();
                    })
                ;
            })
        ;
    });

    // Test validation with a few invalid submissions
    it('cannot submit bogus HaveYouBeenHereRecently task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'HaveYouBeenHereRecently',
                outcome: {
                    beenHere: 'wrong'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });

    it('cannot submit bogus MentionVegan task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'MentionVegan',
                outcome: {
                    // Missing "commitment" property
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });

    it('cannot submit bogus MentionVegan task: validate inner outcome object', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'MentionVegan',
                outcome: {
                    commitment: 'bogus'
                }

            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });

    it('cannot submit a bogus RateLocationQuality task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: locationId,
                type: 'RateLocationQuality',
                outcome: {
                    quality: 100 // That's way too large for a 1-5 rating
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(500);
                done();
            })
        ;
    });
});


h.describe('Product tasks referring to existing products.', function() {
    it('can submit RateProduct task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                product: 101,
                type: 'RateProduct',
                outcome: {
                    rating: 1
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('RateProduct', 'type of task');
                expect(res.body.product).toBe(101, 'product id');
                expect(typeof res.body.outcome).toBe('object', 'outcome');
                expect(res.body.outcome.rating).toBe(1, 'outcome rating');
                done();
            })
        ;
    });

    it('can submit BuyProduct task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                type: 'BuyProduct',
                outcome: {
                    commitment: 'no'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('BuyProduct', 'type of task');
                expect(res.body.outcome.commitment).toEqual('no', 'outcome commitment');
                expect(typeof res.body.outcome.notes).toEqual('undefined', 'outcome notes');
                done();
            })
        ;
    });

    it('can submit SetProductName task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                product: 101,
                type: 'SetProductName',
                outcome: {
                    name: 'Indian Curry'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('SetProductName', 'type of task');
                expect(res.body.product).toBe(101, 'product id');
                expect(typeof res.body.outcome).toBe('object', 'outcome');
                expect(res.body.outcome.name).toBe('Indian Curry', 'outcome name');
                done();
            })
        ;
    });

    it('can submit SetProductAvailability task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                product: 101,
                type: 'SetProductAvailability',
                outcome: {
                    availability: 'seasonal'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('SetProductAvailability', 'type of task');
                expect(res.body.product).toBe(101, 'product id');
                expect(typeof res.body.outcome).toBe('object', 'outcome');
                expect(res.body.outcome.availability).toBe('seasonal', 'outcome availability');
                done();
            })
        ;
    });
});


h.describe('Update of products.', function() {
    it('correctly updates product rating when submitting RateProduct task.', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                product: 101,
                type: 'RateProduct',
                outcome: {
                    rating: 5
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('RateProduct', 'type of task');

                h.request('GET', h.baseURL + 'location/6')
                    .end(function(err, res) {
                        var products = res.body.products;
                        var curry = _.findWhere(products, {id: 101});
                        expect(curry).toBeDefined('curry product is defined');
                        expect(curry.rating).toBeDefined('curry has a rating');
                        expect(curry.rating.average).toBe(4.5, 'curry has correct rating');
                        expect(curry.rating.numRatings).toBe(2, 'curry hast correct number of ratings');

                        var samosa = _.findWhere(products, {id: 102});
                        expect(samosa).toBeDefined('samosa product is defined');
                        expect(samosa.rating).toBeDefined('samosa has a rating');
                        expect(samosa.rating.average).toBe(3, 'samosa  has correct unchanged rating');
                        expect(samosa.rating.numRatings).toBe(1, 'samosa hast correct number of ratings');

                        // Submit again to verify it replaces the rating
                        h.request('POST', h.baseURL + 'task')
                            .send({
                                location: 6,
                                product: 101,
                                type: 'RateProduct',
                                outcome: {
                                    rating: 1
                                }
                            })
                            .end(function() {
                                h.request('GET', h.baseURL + 'location/6')
                                    .end(function(err, res) {
                                        var curry = _.findWhere(res.body.products, {id: 101});
                                        expect(curry.rating.numRatings).toBe(2, 'still has 2 ratings');
                                        expect(curry.rating.average).toBe(2.5, 'updated rating');
                                        done();
                                    })
                                ;
                            })
                        ;
                    })
                ;
            })
        ;
    });

    it('can update product name with SetProductName task.', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                product: 101,
                type: 'SetProductName',
                outcome: {
                    name: 'Indian Curry'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('SetProductName', 'type of task');

                h.request('GET', h.baseURL + 'location/6')
                    .end(function(err, res) {
                        var products = res.body.products;
                        var curry = _.findWhere(products, {id: 101});

                        expect(curry).toBeDefined('curry product is defined');
                        expect(curry.name).toBe('Indian Curry', 'correctly updated name');
                        done();
                    })
                ;
            })
        ;
    });

    it('can update product availability with SetProductAvailability task.', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 6,
                product: 101,
                type: 'SetProductAvailability',
                outcome: {
                    availability: 'weekly'
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.type).toBe('SetProductAvailability', 'type of task');

                h.request('GET', h.baseURL + 'location/6')
                    .end(function(err, res) {
                        var products = res.body.products;
                        var curry = _.findWhere(products, {id: 101});

                        expect(curry).toBeDefined('curry product is defined');
                        expect(curry.availability).toBe('weekly', 'correctly updated availability');
                        done();
                    })
                ;
            })
        ;
    });
});

h.describe('Task API methods and their influence on locations.', function() {
    // TODO WIP: replace this with that the person is added to the list of contributors
    xit('location can change owner when new task is submitted', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: '000000000000000000000006', // Task in dosha
                type: 'visitBonus',
                outcome: true,
                points: 50
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                expect(res.body.causedOwnerChange).toBe(true, 'task caused an owner change');

                // Check how the location looks now
                h.request('GET', h.baseURL + 'location/000000000000000000000006')
                    .end(function(err, res) {
                        expect(res.statusCode).toBe(200);

                        var dosha = res.body;
                        expect(dosha).toBeDefined('returned dosha');
                        expect(dosha.owner.id).toBe('000000000000000000000001', 'Alice is now owner');
                        expect(dosha.owner.nickname).toBe('Alice', 'Got correct owner nickname');
                        var alicePoints = dosha.points['000000000000000000000001'];
                        var bobPoints = dosha.points['000000000000000000000002'];
                        expect(alicePoints).toBeGreaterThan(0, 'Alice has points');
                        expect(bobPoints).toBeGreaterThan(0, 'Bob has points');
                        expect(alicePoints).toBeGreaterThan(bobPoints, 'Alice hsa more points than Bob');

                        done();
                    })
                ;
            })
        ;
    });

    it('location tags are updated when same user re-submits the TagLocation task', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 8, // Task in hollow
                type: 'TagLocation',
                outcome: {
                    tags: [
                        'gBreakfast',
                        // No longer specifying gLunch
                        'gDinner',
                        'gSweets',
                        'gSnacks', // Adding new gSnacks
                        'rnBooks'
                    ]
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);

                // Check how the location looks now
                h.request('GET', h.baseURL + 'location/8')
                    .end(function(err, res) {
                        expect(res.statusCode).toBe(200);

                        var tags = res.body.tags;
                        // Check that it updated the count taking into account the last task
                        // and that it didn't simply add the new tags
                        expect(Object.keys(tags).length).toBe(5, 'has the new number of tags');
                        expect(tags.gBreakfast).toBe(1, 'gBreakfast count');
                        expect(tags.gDinner).toBe(1, 'gDinner count');
                        expect(tags.gSweets).toBe(1, 'gSweets count');
                        expect(tags.gSnacks).toBe(1, 'gSnacks count');
                        expect(tags.rnBooks).toBe(1, 'rnBooks count');
                        expect(typeof tags.gLunch).toBe('undefined', 'gLunch no longer there');

                        done();
                    })
                ;
            })
        ;
    });

    it('can remove a previously set website', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 7, // Task at ruprecht (fixtures have a website set)
                type: 'SetLocationWebsite',
                outcome: {
                    website: '',
                    isAvailable: false
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);
                var task = res.body;
                expect(task.type).toBe('SetLocationWebsite', 'type is correct');
                expect(task.outcome.website).toBe('', 'outcome 1 of the task');
                expect(task.outcome.isAvailable).toBe(false, 'outcome 2 of the task');

                h.request('GET', h.baseURL + 'location/7')
                    .end(function(err, res) {
                        expect(typeof res.body.website).toBe('undefined', 'updated location');
                        done();
                    })
                ;
            })
        ;
    });

    it('SetLocationCoordinates task triggers lookup of address', function(done) {
        h.request('POST', h.baseURL + 'task')
            .send({
                location: 7,
                type: 'SetLocationCoordinates',
                outcome: {
                    latitude: 46.1,
                    longitude: 7.5
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(201);

                h.request('GET', h.baseURL + 'location/7')
                    .end(function(err, res) {
                        var loc = res.body;
                        expect(loc.lat).toBe(46.1, '1 updated location');
                        expect(loc.lng).toBe(7.5, '2 updated location');

                        // Check that it got the address from the Nominatim mock
                        expect(loc.address.street).toBe('Bundesplatz', 'got street');
                        expect(loc.address.house).toBe('1', 'got house');
                        expect(loc.address.postcode).toBe('3005', 'got postcode');
                        expect(loc.address.city).toBe('Bern', 'got city');
                        expect(loc.address.country).toBe('Switzerland', 'got country');
                        done();
                    })
                ;
            })
        ;
    });
});
