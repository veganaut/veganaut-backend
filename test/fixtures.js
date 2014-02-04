/**
 * This script prepares a database with test fixtures.
 */

'use strict';

var mongoose = require('mongoose');

require('../app/models/Person');
require('../app/models/Activity');
require('../app/models/ActivityLink');
require('../app/models/GraphNode');
var Person = mongoose.model('Person');
var Activity = mongoose.model('Activity');
var ActivityLink = mongoose.model('ActivityLink');
var GraphNode = mongoose.model('GraphNode');


var setupFixtures = function (done) {
    var alice = new Person({
        email: 'foo@bar.baz',
        password: 'foobar',
        fullName: 'Alice Alison'
    });
    var bob = new Person({
        email: 'im@stoop.id',
        password: 'bestpasswordever',
        fullName: 'Bob Burton',
        gender: 'male'
    });
    var carol = new Person({
        email: 'son@ainbfl.at',
        password: 'you\'ll never guess',
        fullName: 'Carol',
        gender: 'other',
        address: 'Cäcilienstr. 5, 3006 Bern'
    });
    var dave = new Person({
        fullName: 'Dave Donaldsson'
    });

    var buyActivity = new Activity({
        name: 'Buy something vegan for ...',
        className: 'Shopping',
        givesVegBytes: false
    });

    var cookActivity = new Activity({
        name: 'Cook something vegan for ...',
        className: 'Cooking',
        givesVegBytes: true
    });


    var aliceBuysSomethingForBob = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [bob.id],
        location: 'Bern, Switzerland',
        startedAt: '2014-01-10'
    });


    var aliceKnowsBob = new GraphNode({
        owner: alice.id,
        target: bob.id
    });

    // async fun :)
    Person.remove({}, function (err) {
        if (err) { done(err); }
        Activity.remove({}, function (err) {
            if (err) { done(err); }
            ActivityLink.remove({}, function (err) {
                if (err) { done(err); }
                ActivityLink.remove({}, function (err) {
                    if (err) { done(err); }
                    GraphNode.remove({}, function (err) {
                        if (err) { done(err); }
                        alice.save(function (err) {
                            if (err) { done(err); }
                            bob.save(function (err) {
                                if (err) { done(err); }
                                carol.save(function (err) {
                                    if (err) { done(err); }
                                    dave.save(function (err) {
                                        if (err) { done(err); }
                                        buyActivity.save(function (err) {
                                            if (err) { done(err); }
                                            cookActivity.save(function (err) {
                                                if (err) { done(err); }
                                                aliceBuysSomethingForBob.save(function (err) {
                                                    if (err) { done(err); }
                                                    aliceKnowsBob.save(function(err) {
                                                        if (err) { done(err); }
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.setupFixtures = setupFixtures;


if (require.main === module) {
    mongoose.connect('mongodb://localhost/monkey', function(err) {
        if (err) {
            console.log('Could not connect to Mongo: ', err);
            process.exit();
        }
        setupFixtures(function() {
            mongoose.disconnect();
        });
    });
}
