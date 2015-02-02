'use strict';

var async = require('async');
var mongoose = require('mongoose');
var Location = mongoose.model('Location');
var Product = mongoose.model('Product');

//Constant values for the controller
var NUM_MAX_LIMIT = 20,
    NUM_SKIP_MIN_VALUE = 0,
    NUM_MIN_LIMIT = 1,
    NUM_MAX_BOUNDING_BOX = 180;

exports.list = function(req, res, next) {
  var coords, ObjectId = mongoose.Types.ObjectId, ids = [], limit, skip, error, box = [[],[]];
  limit = parseInt(req.query.limit, 10) || NUM_MAX_LIMIT;
  skip = parseInt(req.query.skip, 10) || NUM_SKIP_MIN_VALUE;

  function isInteger(element) {
    return parseFloat(element);
  }

  //check if number is valid, > 1, <20
  if(typeof limit !== 'number') {
    error = new Error('limit should be a Number');
    return next(error);
  } else if (limit > NUM_MAX_LIMIT) {
    error = new Error('limit should be less than twenty');
    return next(error);
  } else if (limit < NUM_MIN_LIMIT) {
    error = new Error('limit should be greater than one');
    return next(error);
  }

  //checks if skip is valid, > 0
  if (typeof skip !== 'number') {
    error = new Error('Skip should be a number');
    return next(error);
  } else if (skip < NUM_SKIP_MIN_VALUE) {
    error = new Error('Skip should be equal to or greater than 0');
    return next(error);
  }
  //checks if coordinates are sent else
  if (!req.query.bounds) {
    coords = {};
  } else {
    var bounds = req.query.bounds;
    bounds = bounds.split(',');
    //checks if every item is a valid number
    if (!bounds || !bounds.every(isInteger)) {
      error = new Error('Incorrect parameter');
      return next(error);
    }
    bounds = bounds.map(function(x) {
      return parseFloat(x);
    });
    if (Math.abs(bounds[2] - bounds[0]) >= NUM_MAX_BOUNDING_BOX) {
      error = new Error('Bounding box is too big');
      return next(error);
    }
    box[0][0] = bounds[0];
    box[0][1] = bounds[1];
    box[1][0] = bounds[2];
    box[1][1] = bounds[3];
    coords = {coordinates: {$within: {$box: box}}};
  }

  Location
    .find(coords)
    .exec(function(err, locations) {
      if (err) {
        return next(err);
      }
      async.each(locations, function(location, cb) {
        //Pushes all ids into an array as expected by MongoDB
        ids.push(new ObjectId(location._id));
        cb();
      },
      function(err) {
        if (err) {return next(err); }
        Product
          .find({'location': {$in: ids}})
          .skip(skip)
          .limit(limit)
          .sort('-ratings.rank -ratings.count')
          .exec(function(err, products) {
            if (err) {return next(err); }
            var response = {};
            response.products = products;
            response.totalProducts = products.length;
            return res.send(response);
          });
      });
    });
};