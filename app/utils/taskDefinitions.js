'use strict';

var fs = require('fs');
var yaml = require('js-yaml');

module.exports = yaml.safeLoad(fs.readFileSync(__dirname + '/taskDefinitions.yml', 'utf8'));
