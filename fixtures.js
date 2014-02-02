/**
 * This script prepares a database with test fixtures.
 */

'use strict';
/* global describe, it, expect */

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/monkey', function(err) {
    if (err) {
        console.log('Could not connect to Mongo: ', err);
        process.exit();
    }
});

require('./app/models/Person');
var Person = mongoose.model('Person');

Person.remove({}).exec();
var alice = new Person({
    email: 'foo@bar.baz',
    password: 'bestpasswordever',
    fullName: 'Alice Alison'
});
alice.save();
var bob = new Person({
    email: 'im@stoop.id',
    password: 'bestpasswordever',
    fullName: 'Bob Burton',
    gender: 'male'
});
bob.save();
var carol = new Person({
    email: 'son@ainbfl.at',
    password: 'you\'ll never guess',
    fullName: 'Carol',
    gender: 'other',
    address: 'Cäcilienstr. 5, 3006 Bern'
});
carol.save();
var dave = new Person({
    fullName: 'Dave Donaldsson'
});
dave.save();

//Activity.remove({}).exec();
//var buyActivity = new Activity({
//    name: 'Buy something vegan for ...',
//    className: 'Shopping',
//    givesVegBytes: false
//});
//buyActivity.save();



mongoose.disconnect();