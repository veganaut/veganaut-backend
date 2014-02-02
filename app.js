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

// routes
app.get('/', routes.index);

var PersonController = require('./app/controllers/PersonController');
app.get('/person', PersonController.index);

// server
var server = http.createServer(app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports = server;
