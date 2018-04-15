'use strict';
var express = require('express');
var cors = require('cors');
var morgan = require('morgan');
var bodyParser = require('body-parser');

// Controllers
var AreaOverview = require('./app/controllers/AreaOverview');
var GeoIP = require('./app/controllers/GeoIP');
var Location = require('./app/controllers/Location');
var Task = require('./app/controllers/Task');
var Person = require('./app/controllers/Person');
var Score = require('./app/controllers/Score');
var Session = require('./app/controllers/Session');
var PasswordResetEmail = require('./app/controllers/PasswordResetEmail');
var Product = require('./app/controllers/Product');
var Sitemap = require('./app/controllers/Sitemap');

// Create the app
var app = express();

// Only register logger in non-test environment
var env = process.env.NODE_ENV || 'development';
if (env !== 'test') {
    var morganFormat = 'combined';
    if (env === 'development') {
        // Use short format in dev
        morganFormat = 'dev';
    }
    app.use(morgan(morganFormat));
}

// Register json body parser
app.use(bodyParser.json());

// Try to add the logged in user
app.use(Session.addUserToRequest);

// Home
app.options('/', cors());
app.get('/', function(req, res) {
    res.send({status: 'OK'});
});

// TODO: add e2e tests that unauthenticated users can't access methods they shouldn't

// Session
app.options('/session', cors());
app.post('/session', cors(), Session.create);
app.delete('/session', cors(), Session.restrict, Session.delete);

// Person
app.options('/person', cors());
app.options('/person/me', cors());
app.options('/person/isValidToken/:token', cors());
app.options('/person/reset', cors());
app.options('/person/:id', cors());
app.post('/person', cors(), Person.register);
app.get('/person/me', cors(), Session.restrict, Person.getMe);
app.put('/person/me', cors(), Session.restrict, Person.updateMe);
app.get('/person/isValidToken/:token', cors(), Person.isValidToken);
app.post('/person/reset', cors(), Person.resetPassword);
app.get('/person/:id', cors(), Session.restrict, Person.getById);

// Area overview
app.options('/areaOverview', cors());
app.get('/areaOverview', cors(), AreaOverview.get);

// Task
app.options('/task', cors());
app.post('/task', cors(), Session.restrict, Task.submit);

// Location
app.options('/location', cors());
app.post('/location', cors(), Session.restrict, Location.create);
app.options('/location/list', cors());
app.get('/location/list', cors(), Location.list);
app.options('/location/search', cors());
app.get('/location/search', cors(), Location.search);
app.options('/location/:locationId', cors());
app.get('/location/:locationId', cors(), Location.get);
app.options('/location/:locationId/suggestedTask', cors());
app.get('/location/:locationId/suggestedTask', cors(), Session.restrict, Location.getSuggestedTask);

// Score
app.options('/score', cors());
app.get('/score', cors(), Session.restrict, Score.stats);

// Products
app.options('/product/list', cors());
app.get('/product/list', cors(), Product.list);

// GeoIP
app.options('/geoip', cors());
app.get('/geoip', cors(), GeoIP.get);

app.options('/passwordResetEmail', cors());
app.post('/passwordResetEmail', cors(), PasswordResetEmail.send);

// Sitemap of frontend
app.get('/sitemap.xml', Sitemap.getSitemap);

// Handle errors and if no one responded to the request
app.use(function(err, req, res, next) {
    // Check if we got an error
    if (err) {
        // TODO: should have the status code on the Error object
        if (res.statusCode < 400) {
            // If no error status code has been set, use 500 by default
            res.status(500);
        }

        // Send the error details
        res.send({error: err.message, details: err.details});
    }
    else {
        // No error given, still ended up here, must be 404
        res.status(404).send({error: 'method not found'});
    }
    next();
});


// Start server if run as main module
if (require.main === module) {
    // Connect to db
    require('./app/models');
    // var db = require('./app/models');
    // db.sequelize.sync({force: true}).then(function() {
    //     db.sequelize.close();
    // });

    // Get port
    var port = process.env.PORT || 3000;
    app.listen(port, function(err) {
        if (err) {
            console.log('Could not listen: ', err);
            process.exit();
        }

        console.log('Running in ' + app.settings.env + ' environment');
        console.log('Express server listening on port ' + port);
    });
}

module.exports = app;
