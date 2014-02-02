/**
 * A controller for our people :)
 */

'use strict';

var mongoose = require('mongoose');
var Person = mongoose.model('Person');

exports.index = function(req, res) {
    console.log('Hi from PersonController');
    Person.find({}).exec(function(err, people) {
        console.log('Just found stuff');
        if (err) { return res.send(500, 'Sorry, couldn\'t get people'); }
        return res.send(people);
    });
};