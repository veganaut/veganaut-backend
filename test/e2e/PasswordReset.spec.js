'use strict';

var h = require('../helpers_');

describe('Password reset.', function() {
    beforeEach(function() {
        h.mockMailer.sentMails = [];
    });

    h.describe('Passwort reset.', function() {
        it('can request a reset token', function() {
            h.runAsync(function(done) {
                h.request('POST', h.baseURL + 'passwordResetEmail')
                    .send({
                        email: 'foo@bar.baz'
                    })
                    .end(function(res) {
                        expect(res.statusCode).toBe(200, 'successful request');
                        var sentMails = h.mockMailer.sentMails;
                        expect(sentMails.length).toBe(1, 'sent one e-mail');

                        var mail = sentMails[0];
                        expect(mail.to).toBe('foo@bar.baz', 'correct recipient');
                        var linkRegex = /https?:\/\/\S+\/reset\/(\S+)\s/;
                        expect(mail.text).toMatch(linkRegex, 'contains a reset link');
                        var resetCode = mail.text.match(linkRegex)[1];
                        expect(resetCode.length).toBeGreaterThan(20, 'has a reasonably  long reset link');
                        done();
                    })
                ;
            });
        });
    });
});
