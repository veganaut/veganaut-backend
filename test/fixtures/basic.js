/**
 * This script prepares a database with test fixtures.
 */

'use strict';

var mongoose = require('mongoose');
var async = require('async');

require('../../app/models/Person');
require('../../app/models/Activity');
require('../../app/models/ActivityLink');
require('../../app/models/GraphNode');
var Person = mongoose.model('Person');
var Activity = mongoose.model('Activity');
var ActivityLink = mongoose.model('ActivityLink');
var GraphNode = mongoose.model('GraphNode');


var setupFixtures = function (done) {
    var alice = new Person({
        _id: '000000000000000000000001',
        email: 'foo@bar.baz',
        password: 'foobar',
        fullName: 'Alice Alison'
    });
    var bob = new Person({
        _id: '000000000000000000000002',
        email: 'im@stoop.id',
        password: 'bestpasswordever',
        fullName: 'Bob Burton',
        gender: 'male'
    });
    var carol = new Person({
        _id: '000000000000000000000003',
        fullName: 'Carol'
    });
    var dave = new Person({
        _id: '000000000000000000000004',
        fullName: 'Dave Donaldsson'
    });
    var eve = new Person({
        _id: '000000000000000000000005',
        fullName: 'Eve'
    });

    var buyActivity = new Activity({
        _id: 'a00000000000000000000001',
        name: 'Buy something vegan for ...',
        className: 'Shopping',
        givesVegBytes: false
    });

    var cookActivity = new Activity({
        _id: 'a00000000000000000000002',
        name: 'Cook something vegan for ...',
        className: 'Cooking',
        givesVegBytes: true
    });


    var aliceBuysSomethingForBob = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [bob.id],
        location: 'Bern, Switzerland',
        startDate: '2014-01-10',
        success: true,
        referenceCode: 'Ff8tEQ'
    });

    var aliceCooksSomethingForCarol = new ActivityLink({
        activity: cookActivity.id,
        sources: [alice.id],
        targets: [carol.id],
        location: 'Bern',
        startDate: '2014-02-20',
        success: true,
        referenceCode: '30Ajak'
    });

    var aliceWantsToBuySomethingForDave = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [dave.id],
        success: false,
        referenceCode: 'OiWCrB'
    });

    var bobWantsToBuySomethingForEve = new ActivityLink({
        activity: buyActivity.id,
        sources: [bob.id],
        targets: [eve.id],
        success: false,
        referenceCode: 'AK92oj'
    });


    var aliceKnowsBob = new GraphNode({
        owner: alice.id,
        target: bob.id
    });

    var bobKnowsAlice = new GraphNode({
        owner: bob.id,
        target: alice.id
    });

    var aliceKnowsCarol = new GraphNode({
        owner: alice.id,
        target: carol.id
    });

    var aliceKnowsDave = new GraphNode({
        owner: alice.id,
        target: dave.id
    });

    var carolKnowsAlice = new GraphNode({
        owner: carol.id,
        target: alice.id
    });

    var bobKnowsEve = new GraphNode({
        owner: bob.id,
        target: eve.id
    });

    // TODO: use alice.save.bind(alice) instead of this proxy
    var proxy = function(fn, context) {
        return function() {
            return fn.apply(context, [].slice.call(arguments));
        };
    };

    var remove = Activity.remove;
    var save = alice.save;

    async.series([
        proxy(remove, Activity),
        proxy(remove, ActivityLink),
        proxy(remove, GraphNode),
        proxy(remove, Person),
        proxy(save, alice),
        proxy(save, bob),
        proxy(save, carol),
        proxy(save, dave),
        proxy(save, eve),
        proxy(save, buyActivity),
        proxy(save, cookActivity),
        proxy(save, aliceBuysSomethingForBob),
        proxy(save, aliceCooksSomethingForCarol),
        proxy(save, aliceWantsToBuySomethingForDave),
        proxy(save, bobWantsToBuySomethingForEve),
        proxy(save, aliceKnowsBob),
        proxy(save, bobKnowsAlice),
        proxy(save, aliceKnowsCarol),
        proxy(save, aliceKnowsDave),
        proxy(save, carolKnowsAlice),
        proxy(save, bobKnowsEve)
    ], function(err) {
        if (err) {
            console.log('Error while loading fixtures: ', err);
            done(err);
        }
        done();
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
