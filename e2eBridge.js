/**
 * Module dependencies.
 */
'use strict';
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();

// all environments
app.set('port', process.env.PORT || 3333);
app.use(bodyParser.json());

// Home
app.options('/', cors());
app.get('/', function(req, res) {
    res.send({status: 'OK'});
});

// Fixtures
app.options('/fixtures/:fixtureName', cors());
app.get('/fixtures/:fixtureName', cors(), function(req, res) {
    var fixtureName = req.params.fixtureName;
    var fixtures;
    try {
        fixtures = require('./test/fixtures/' + fixtureName);
    }
    catch (e) {
        res.status(404);
        return res.send({status: 'error', error: 'fixture "' + fixtureName + '" does not exist'});
    }

    fixtures.setupFixtures()
        .then(function() {
            return res.send({status: 'ok'});
        })
        .catch(function(err) {
            res.status(500);
            return res.send({status: 'error', error: err});
        })
    ;
});

// Handle errors and if no one responded to the request
app.use(function(err, req, res, next) {
    res.status(404).send({status: 'error', error: 'method not found'});
    next();
});

// Start server if run as main module
if (require.main === module) {
    // Get port
    var port = process.env.PORT || 3333;

    // Load models to establish db connection
    require('./app/models');

    app.listen(port, function(err) {
        if (err) {
            console.log('Could not listen: ', err);
            process.exit();
        }

        console.log('Running in ' + app.settings.env + ' environment');
        console.log('Express server listening on port ' + port);
    });
}
