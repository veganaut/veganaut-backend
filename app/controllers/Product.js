'use strict';

var async = require('async');
var mongoose = require('mongoose');
var Location = mongoose.model('Location');
var Product = mongoose.model('Product');

exports.list = function(req, res, next) {
  var coords;
  var limit = parseInt(req.query.limit, 10) || 20;
  var skip = parseInt(req.query.skip, 10) || 0;
  var error;
  function isInteger(element) {
    return parseFloat(element);
  }

  //check if number is valid, > 1, <20
  if(typeof limit !== 'number') {
    error = new Error('limit should be a Number');
    return next(error);
  } else if (limit > 20) {
    error = new Error('limit should be less than twenty');
    return next(error);
  } else if (limit < 1) {
    error = new Error('limit should be greater than one');
    return next(error);
  }

  //checks if skip is valid, > 0
  if (typeof skip !== 'number') {
    error = new Error('Skip should be a number');
    return next(error);
  } else if (skip < 0) {
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
    if (Math.abs(bounds[2] - bounds[0]) >= 180) {
      error = new Error('Bounding box is too big');
      return next(error);
    }
    var box = [[],[]];
    box[0][0] = bounds[0];
    box[0][1] = bounds[1];
    box[1][0] = bounds[2];
    box[1][1] = bounds[3];
    coords = {coordinates: {$within: {$box: box}}};
  }

  Location
    .find(coords)
    .exec(function(err, locations) {
        console.log(1, locations);
      if (err) {
        return next(err);
      }
        var ObjectId = mongoose.Types.ObjectId;
        var ids = [];
      async.each(locations, function(location, cb) {
        ids.push(new ObjectId(location._id));
        console.log(2, ids);
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