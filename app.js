/**
 * Module dependencies.
 */
'use strict';
var express = require('express');
var mongoose = require('mongoose');
var routes = require('./routes');
var cors = require('cors');

var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

// database
mongoose.connect('mongodb://localhost/monkey', function(err) {
    if (err) {
        console.log('Could not connect to Mongo: ', err);
        process.exit();
    }
});

// models
require('./app/models/Activity.js');
require('./app/models/ActivityLink.js');
require('./app/models/GraphNode.js');
require('./app/models/Person.js');

/*
 * Controllers
 */
var Person = require('./app/controllers/Person');

// Dummy Controllers
var Graph = require('./app/controllers/Graph');
var Session = require('./app/controllers/Session');
var Activity = require('./app/controllers/Activity');
var ActivityLink = require('./app/controllers/ActivityLink');

/*
 * Routes
 * Following the route-separation express example:
 * https://github.com/visionmedia/express/blob/master/examples/route-separation/index.js
 */
// Home
app.options('/', cors());
app.get('/', routes.index);

// Graph
app.options('/graph/me', cors());
app.options('/graph', cors());
app.get('/graph/me', cors(), Session.restrict, Graph.view);
app.put('/graph', cors(), Session.restrict, Graph.update);


// Session
app.options('/session', cors());
app.post('/session', cors(), Session.create);
app.delete('/session', cors(), Session.restrict, Session.delete);
app.get('/session/status', cors(), Session.restrict, Session.status); //TODO remove this test eventually once login works

// Activity
app.options('/activity', cors());
app.get('/activity', cors(), Session.restrict, Activity.list);

// ActivityLink
app.options('/activityLink/referer', cors());
app.options('/activityLink', cors());
app.post('/activityLink/referer', cors(), ActivityLink.update);
app.post('/activityLink', cors(), Session.restrict, ActivityLink.link);

// Person
app.options('/person', cors());
app.get('/person', cors(), Session.restrict, Person.index);

// assume 404 since no middleware responded
app.use(function(req, res, next) {
    // TODO
    res.send({ status: '404' });
    next();
});

// server
var server = http.createServer(app);
if (require.main === module) {
    server.listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port'));
    });
}
server.on('close', function () {
    mongoose.disconnect();
});

module.exports = server;
