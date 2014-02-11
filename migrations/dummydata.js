/**
 * This script prepares a database with test fixtures.
 */

'use strict';

var mongoose = require('mongoose');
var async = require('async');

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
        fullName: 'Dave Donaldson'
    });
    var elisa = new Person({
        email: 'elisa@home.com',
        password: 'youshallnotpass',
        fullName: 'Elisa Emmons',
        gender: 'female'
    });
    var fred = new Person({
        email: 'fred@flinstone.de',
        password: 'pass=spass',
        fullName: 'Fred Farmer',
        gender: 'male',
        address: 'Farmroad 1, 1234 Farmville'
    });
    var gerda = new Person({
        email: 'gerda@mail.de',
        password: 'passion',
        fullName: 'Gerda Gerhardt',
        gender: 'other',
        address: 'Geranienweg 1, 8000 Zürich'
    });
    var henry = new Person({
        email: 'henry@henry.com',
        password: 'mrhankey',
        fullName: 'Henry Hauser',
        gender: 'male',
        address: 'Hausweg 6, 43210 Ennetbergen'
    });
    var irene = new Person({
        email: 'irene@irene.com',
        password: 'password',
        fullName: 'Irene Irgendwer',
        gender: 'female',
        address: 'Irrenanstaltweg 87, 45670 Jungdorf'
    });
    var john = new Person({
        email: 'john@john.com',
        password: 'passmethesalt',
        fullName: 'John Jacobson',
        gender: 'other',
        address: 'Ohnesorgen 3, 678588 Achtung'
    });
    var katherine = new Person({
        email: 'kat@herine.com',
        password: 'passpass',
        fullName: 'Katherine Klauser',
        gender: 'female',
        address: 'Ulmenweg 990, 743569 Kleinstadtdorf'
    });
    var larry = new Person({
        email: 'larry@larry.com',
        password: 'unpassend',
        fullName: 'Larry Larson',
        gender: 'male',
        address: 'Arsenweg 14, 6000 Agathon'
    });
    var martha = new Person({
        email: 'martha@martha.com',
        password: 'passauf',
        fullName: 'Martha Marthaler',
        gender: 'female',
        address: 'Marsstr. 4, 67809 Walrus'
    });
    var nicole = new Person({
        email: 'nicole@nicole.com',
        password: 'passtmir',
        fullName: 'Nicole Nidecker',
        gender: 'female',
        address: 'Hürzelerstr. 65, 2000 Luzern'
    });
    var otto = new Person({
        fullName: 'Otto Omlin'
    });
    var petra = new Person({
        fullName: 'Petra Peter'
    });
    var quentin = new Person({
        fullName: 'Quentin Tarantino'
    });
    var rose = new Person({
        fullName: 'Rose'
    });
    var saul = new Person({
        fullName: 'Saul Kripke'
    });
    var tabea = new Person({
        fullName: 'Tabea Thomson'
    });
    var urs = new Person({
        fullName: 'Urs Ulmer'
    });
    var viola = new Person({
        fullName: 'Viola Vatter'
    });
    var werner = new Person({
        fullName: 'Werner'
    });
    var xenia = new Person({
        fullName: 'Xenia'
    });
    var yves = new Person({
        fullName: 'Yves'
    });
    var zora = new Person({
        fullName: 'Zora Zuber'
    });

    var buyActivity = new Activity({
        name: 'Buy something vegan for ...',
        className: 'Shopping',
        givesVegBytes: false
    });

    var cookActivity = new Activity({
        name: 'Cook/bake something vegan for ...',
        className: 'Cooking',
        givesVegBytes: true
    });


    var aliceBuysSomethingForBob = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [bob.id],
        location: 'Bern, Switzerland',
        startDate: '2014-01-10'
    });
    var aliceBuysSomethingForCarol = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [carol.id],
        location: 'Bern, Switzerland',
        startDate: '2014-01-17'
    });
    var aliceCooksSomethingForCarol = new ActivityLink({
        activity: cookActivity.id,
        sources: [alice.id],
        targets: [carol.id],
        location: 'Bern, Switzerland',
        startDate: '2014-01-17'
    });
    var aliceCooksSomethingForDave = new ActivityLink({
        activity: cookActivity.id,
        sources: [alice.id],
        targets: [dave.id],
        location: 'Bern, Switzerland'
    });
    var aliceCooksSomethingForElisa = new ActivityLink({
        activity: cookActivity.id,
        sources: [alice.id],
        targets: [elisa.id],
        location: 'Zürich, Switzerland',
        startDate: '2014-08-17'
    });
    var aliceBuysSomethingForFred = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [fred.id],
        location: 'Bern, Switzerland',
        startDate: '2014-05-09'
    });
    var aliceBuysSomethingForGerda = new ActivityLink({
        activity: buyActivity.id,
        sources: [alice.id],
        targets: [gerda.id],
        location: 'Bern, Switzerland',
        startDate: '2014-01-24'
    });
	
	
    var bobBuysSomethingForFred = new ActivityLink({
        activity: buyActivity.id,
        sources: [bob.id],
        targets: [fred.id],
        location: 'Bern, Switzerland',
        startDate: '2014-02-03'
    });
    var bobBuysSomethingForLarry = new ActivityLink({
        activity: buyActivity.id,
        sources: [bob.id],
        targets: [larry.id],
        location: 'Basel, Switzerland',
        startDate: '2014-02-05'
    });
    var bobBuysSomethingForGerda = new ActivityLink({
        activity: buyActivity.id,
        sources: [bob.id],
        targets: [gerda.id],
        location: 'Thun, Switzerland',
        startDate: '2014-02-09'
    });
    var bobBuysSomethingForAlice = new ActivityLink({
        activity: buyActivity.id,
        sources: [bob.id],
        targets: [alice.id],
        location: 'Bern, Switzerland',
        startDate: '2014-02-02'
    });
    var carolCooksSomethingForAliceAgain = new ActivityLink({
        activity: cookActivity.id,
        sources: [carol.id],
        targets: [alice.id],
        location: 'Biel, Switzerland',
        startDate: '2014-07-03'
    });
    var carolCooksSomethingForAlice = new ActivityLink({
        activity: cookActivity.id,
        sources: [carol.id],
        targets: [alice.id],
        location: 'Biel, Switzerland',
        startDate: '2014-04-06'
    });
    var carolCooksSomethingForKatherine = new ActivityLink({
        activity: cookActivity.id,
        sources: [carol.id],
        targets: [katherine.id],
        location: 'Biel, Switzerland',
        startDate: '2014-02-09'
    });
    var carolBuysSomethingForFred = new ActivityLink({
        activity: buyActivity.id,
        sources: [carol.id],
        targets: [fred.id],
        location: 'Täufelen, Switzerland',
        startDate: '2014-03-01'
    });
    var elisaBuysSomethingForJohn = new ActivityLink({
        activity: buyActivity.id,
        sources: [elisa.id],
        targets: [john.id],
        location: 'Geneve, Switzerland',
        startDate: '2014-03-01'
    });
    var elisaBuysSomethingForBob = new ActivityLink({
        activity: buyActivity.id,
        sources: [elisa.id],
        targets: [bob.id],
        location: 'Lausanne, Switzerland',
        startDate: '2014-02-01'
    });
    var elisaCooksSomethingForGerda = new ActivityLink({
        activity: cookActivity.id,
        sources: [elisa.id],
        targets: [gerda.id],
        location: 'Payerne, Switzerland',
        startDate: '2014-02-16'
    });
    var larryBuysSomethingForHenry = new ActivityLink({
        activity: buyActivity.id,
        sources: [larry.id],
        targets: [henry.id],
        location: 'London, England',
        startDate: '2014-08-08'
    });
	

    var aliceSeesBob = new GraphNode({
        owner: alice.id,
        target: bob.id
    });
    var aliceSeesCarol = new GraphNode({
        owner: alice.id,
        target: carol.id
    });
    var aliceSeesDave = new GraphNode({
        owner: alice.id,
        target: dave.id
    });
    var aliceSeesElisa = new GraphNode({
        owner: alice.id,
        target: elisa.id
    });
    var aliceSeesFred = new GraphNode({
        owner: alice.id,
        target: fred.id
    });
    var aliceSeesGerda = new GraphNode({
        owner: alice.id,
        target: gerda.id
    });
    var aliceSeesHenry = new GraphNode({
        owner: alice.id,
        target: henry.id
    });
    var aliceSeesIrene = new GraphNode({
        owner: alice.id,
        target: irene.id
    });
    var aliceSeesJohn = new GraphNode({
        owner: alice.id,
        target: john.id
    });
    var aliceSeesKatherine = new GraphNode({
        owner: alice.id,
        target: katherine.id
    });
    var aliceSeesLarry = new GraphNode({
        owner: alice.id,
        target: larry.id
    });

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
        proxy(save, elisa),
        proxy(save, fred),
        proxy(save, gerda),
        proxy(save, henry),
        proxy(save, irene),
        proxy(save, john),
        proxy(save, katherine),
        proxy(save, larry),
        proxy(save, martha),
        proxy(save, henry),
        proxy(save, nicole),
        proxy(save, otto),
        proxy(save, petra),
        proxy(save, quentin),
        proxy(save, rose),
        proxy(save, saul),
        proxy(save, tabea),
        proxy(save, urs),
        proxy(save, viola),
        proxy(save, werner),
        proxy(save, xenia),
        proxy(save, yves),
        proxy(save, zora),
        proxy(save, buyActivity),
        proxy(save, cookActivity),
        proxy(save, aliceBuysSomethingForBob),
        proxy(save, aliceBuysSomethingForCarol),
        proxy(save, aliceCooksSomethingForCarol),
        proxy(save, aliceCooksSomethingForDave),
        proxy(save, aliceCooksSomethingForElisa),
        proxy(save, aliceBuysSomethingForFred),
        proxy(save, aliceBuysSomethingForGerda),
        proxy(save, bobBuysSomethingForFred),
        proxy(save, bobBuysSomethingForLarry),
        proxy(save, bobBuysSomethingForGerda),
        proxy(save, bobBuysSomethingForAlice),
        proxy(save, carolCooksSomethingForAliceAgain),
        proxy(save, carolCooksSomethingForAlice),
        proxy(save, carolCooksSomethingForKatherine),
        proxy(save, carolBuysSomethingForFred),
        proxy(save, elisaBuysSomethingForJohn),
        proxy(save, elisaBuysSomethingForBob),
        proxy(save, elisaCooksSomethingForGerda),
        proxy(save, larryBuysSomethingForHenry),
        proxy(save, aliceSeesBob),
        proxy(save, aliceSeesCarol),
        proxy(save, aliceSeesDave),
        proxy(save, aliceSeesElisa),
        proxy(save, aliceSeesFred),
        proxy(save, aliceSeesGerda),
        proxy(save, aliceSeesHenry),
        proxy(save, aliceSeesIrene),
        proxy(save, aliceSeesJohn),
        proxy(save, aliceSeesKatherine),
        proxy(save, aliceSeesLarry)
    ], function(err) {
        if (err) {
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
