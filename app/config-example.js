/**angular
 * Example config file for veganaut-backend.
 * Copy this to app/config.js to get a running backend.
 */
module.exports = {
    frontendUrl: 'https://veganaut.net',
    database: {
        connectionUri: 'postgres://user:pass@localhost:5432/dbname'
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
