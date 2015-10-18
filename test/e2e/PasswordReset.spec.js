'use strict';

var h = require('../helpers_');

h.describe('Password reset.', function() {
    var resetToken;
    beforeEach(function() {
        h.mockMailer.sentMails = [];
    });

    it('can request a reset token', function(done) {
        h.request('POST', h.baseURL + 'passwordResetEmail')
            .send({
                email: 'foo@bar.baz'
            })
            .end(function(err, res) {
                expect(res.statusCode).toBe(200, 'successful request');
                var sentMails = h.mockMailer.sentMails;
                expect(sentMails.length).toBe(1, 'sent one e-mail');

                var mail = sentMails[0];
                expect(mail.to).toBe('foo@bar.baz', 'correct recipient');
                var linkRegex = /https?:\/\/\S+\/reset\/(\S+)\s/;
                expect(mail.text).toMatch(linkRegex, 'contains a reset link');
                resetToken = mail.text.match(linkRegex)[1];
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

    it('can reset password', function(done) {
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

// TODO: add more tests that check one can only reset passwords with the correct flow
