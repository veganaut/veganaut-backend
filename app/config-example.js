/**
 * Example config file for veganaut-backend.
 * Copy this to app/config.js to get a running backend.
 */
module.exports = {
    frontendUrl: 'https://veganaut.net',
    locale: {
        available:  ['en', 'de', 'fr'],
        default: 'en'
    },
    email: {
        from: 'veganautnet@yahoo.com',
        transporter: {
            service: 'Yahoo',
            auth: {
                user: 'veganautnet@yahoo.com',
                pass: 'surely you are joking'
            }
        }
    }
};
