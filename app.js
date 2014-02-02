/**
 * Module dependencies.
 */
'use strict';
var express = require('express');
var mongoose = require('mongoose');
var routes = require('./routes');

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
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

// database
var connectToMongoose = function() {
    mongoose.connect('mongodb://localhost/monkey', { server: { socketOptions: { keepAlive: 1 } } });
};
mongoose.connection.on('error', function (err) {
    console.log(err);
});
mongoose.connection.on('disconnected', function () {
    // Just reconnect on disconnect
    connectToMongoose();
});

// models
require('./app/models/Person.js');

/*
 * Controllers
 */
var PersonController = require('./app/controllers/PersonController');

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
app.get('/', routes.index);

// Graph
app.get('/graph/me', Graph.view);
app.put('/graph', Graph.update);


// Session
app.post('/session',Session.create);
app.delete('/session',Session.delete);
app.get('/session/status', Session.restrict, Session.status); //TODO remove this test eventually once login works

// Activity
app.get('/activity',Activity.list);

// ActivityLink
app.post('/activityLink/referer',ActivityLink.update);
app.post('/activityLink',ActivityLink.link);

// Person
app.get('/person', PersonController.index);

// assume 404 since no middleware responded
app.use(function(req, res, next){
    // TODO
    res.send({ status: '404' });
});

// server
var server = http.createServer(app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports = server;
