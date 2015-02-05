/**
 * Mail transporter exposes a nodemailer transporter.
 */
'use strict';
var nodemailer = require('nodemailer');
var config = require('../config.js');

var transporter = nodemailer.createTransport(config.email.transporter);
module.exports = transporter;
