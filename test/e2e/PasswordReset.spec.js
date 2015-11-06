'use strict';

var h = require('../helpers_');

/**
 * Regex to get the reset link from the e-mail
 * @type {RegExp}
 */
var RESET_LINK_REGEX = /https?:\/\/\S+\/reset\/(\S+)\s/;

h.describe('Password reset.', function() {
    var resetToken;
    beforeEach(function() {
        h.mockMailer.sentMails = [];
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    describe('reset of type "reset" (standard).', function() {
        it('can request a reset token of type "reset"', function(done) {
            h.request('POST', h.baseURL + 'passwordResetEmail')
                .send({
                    email: 'foo@bar.baz',
                    type: 'reset'
                })
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200, 'successful request');
                    var sentMails = h.mockMailer.sentMails;
                    expect(sentMails.length).toBe(1, 'sent one e-mail');

                    var mail = sentMails[0];
                    expect(mail.to).toBe('foo@bar.baz', 'correct recipient');
                    expect(mail.text).toMatch(RESET_LINK_REGEX, 'contains a reset link');
                    resetToken = mail.text.match(RESET_LINK_REGEX)[1];
                    expect(resetToken.length).toBeGreaterThan(20, 'has a reasonably long reset token');
                    done();
                })
            ;
        });

        it('can validate token', function(done) {
            h.request('GET', h.baseURL + 'person/isValidToken/' + resetToken)
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200, 'token is valid');
                    done();
                })
            ;
        });

        it('token is invalid after a day', function(done) {
            jasmine.clock().mockDate();
            jasmine.clock().tick(24 * 60 * 60 * 1000);
            h.request('GET', h.baseURL + 'person/isValidToken/' + resetToken)
                .end(function(err, res) {
                    expect(res.statusCode).toBe(400, 'token is invalid');
                    done();
                })
            ;
        });

        it('cannot reset password after one day', function(done) {
            jasmine.clock().mockDate();
            jasmine.clock().tick(24 * 60 * 60 * 1000);
            h.request('POST', h.baseURL + 'person/reset')
                .send({
                    token: resetToken,
                    password: 'newPw1234'
                })
                .end(function(err, res) {
                    expect(res.statusCode).toBe(400, 'failed to reset password');
                    done();
                })
            ;
        });

        it('can reset password before one day has passed', function(done) {
            h.request('POST', h.baseURL + 'person/reset')
                .send({
                    token: resetToken,
                    password: 'newPw1234'
                })
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200, 'successfully reset password');
                    done();
                })
            ;
        });

        it('can login with the new password', function(done) {
            h.request('POST', h.baseURL + 'session')
                .send({
                    email: 'foo@bar.baz',
                    password: 'newPw1234'
                })
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200, 'created session with new pw');
                    expect(typeof res.body.sessionId).toBe('string', 'got a session id');
                    done();
                })
            ;
        });

        it('can no longer validate token', function(done) {
            h.request('GET', h.baseURL + 'person/isValidToken/' + resetToken)
                .end(function(err, res) {
                    expect(res.statusCode).toBe(400, 'token is invalid');
                    expect(typeof res.body.error).toBe('string', 'has an error message');
                    done();
                })
            ;
        });

        it('can no longer reset password', function(done) {
            h.request('POST', h.baseURL + 'person/reset')
                .send({
                    token: resetToken,
                    password: 'anotherNewPw'
                })
                .end(function(err, res) {
                    expect(res.statusCode).toBe(400, 'failed to reset password');
                    expect(typeof res.body.error).toBe('string', 'has an error message');
                    done();
                })
            ;
        });
    });

    describe('reset of type "registration".', function() {
        it('can request a reset token of type "registration"', function(done) {
            h.request('POST', h.baseURL + 'passwordResetEmail')
                .send({
                    email: 'foo@bar.baz',
                    type: 'registration'
                })
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200, 'successful request');
                    var sentMails = h.mockMailer.sentMails;
                    expect(sentMails.length).toBe(1, 'sent one e-mail');

                    var mail = sentMails[0];
                    expect(mail.to).toBe('foo@bar.baz', 'correct recipient');
                    expect(mail.text).toMatch(RESET_LINK_REGEX, 'contains a reset link');
                    resetToken = mail.text.match(RESET_LINK_REGEX)[1];
                    expect(resetToken.length).toBeGreaterThan(20, 'has a reasonably long reset token');

                    done();
                })
            ;
        });

        it('token is still valid after a few days', function(done) {
            jasmine.clock().mockDate();
            jasmine.clock().tick(5 * 24 * 60 * 60 * 1000);
            h.request('GET', h.baseURL + 'person/isValidToken/' + resetToken)
                .end(function(err, res) {
                    expect(res.statusCode).toBe(200, 'token is valid');
                    done();
                })
            ;
        });

        it('token is no longer valid after more than two weeks', function(done) {
            jasmine.clock().mockDate();
            jasmine.clock().tick(14 * 24 * 60 * 60 * 1000);
            h.request('GET', h.baseURL + 'person/isValidToken/' + resetToken)
                .end(function(err, res) {
                    expect(res.statusCode).toBe(400, 'token is invalid');
                    done();
                })
            ;
        });
    });
});
