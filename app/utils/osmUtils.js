/**
 * Helper methods for Open Street Map data and APIs.
 */
'use strict';

var _ = require('lodash');
var https = require('https');


/**
 * OSM properties that are mapped to our "city" address part.
 * @type {string[]}
 */
var CITY_PROPS = ['city', 'town', 'village', 'hamlet', 'suburb', 'state', 'county', 'city_district'];

/**
 * OSM properties that are mapped to our "street" address part.
 * @type {string[]}
 */
var STREET_PROPS = ['road', 'footway', 'pedestrian', 'path', 'cycleway'];

/**
 * User agent string that we use for contacting the OSM APIs.
 * @type {string}
 */
var VEGANAUT_BOT_AGENT = 'VeganautNetBot/0.1 (+https://blog.veganaut.net/contact/)';

// Prepare the object to export
var osmUtils = {};

/**
 * Retrieves an address from the OSM Nominatim API at the given coordinates.
 * @param {string} lat
 * @param {string} lng
 * @param {function} cb TODO: Switch to promises
 */
osmUtils.osmAddressLookup = function(lat, lng, cb) {
    // TODO: error handling: should be logged somewhere!
    https.get({
        hostname: 'nominatim.openstreetmap.org',
        path: '/reverse?accept-language=en&addressdetails=true&format=json&lat=' + lat + '&lon=' + lng,
        // Set the letsencrypt CA certificate as our old version of Node.js doesn't seem to have it built in
        // TODO: quite ugly, but works for now...
        ca: `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`,
        headers: {
            'User-Agent': VEGANAUT_BOT_AGENT
        }
    }, function(resp) {
        resp.setEncoding('utf8');

        // Check if request was successful
        if (resp.statusCode !== 200) {
            return cb(new Error('Got error from OSM Nominatim: ' + resp.statusCode));
        }

        var rawData = '';
        resp.on('data', function(chunk) {
            rawData += chunk;
        });
        resp.on('end', function() {
            var data;
            try {
                data = JSON.parse(rawData);
            }
            catch (e) {}

            if (typeof data === 'undefined') {
                return cb(new Error('Could not parse response from OSM Nominatim.'));
            }
            else {
                return cb(null, data);
            }
        });
    }).on('error', function(e) {
        return cb(new Error('Got error searching OSM Nominatim: ' + e.message));
    });
};

/**
 * Converts an address from OSM to a veganaut one with the following properties:
 * street, houseNumber, city, postcode, country
 * @param {{}} osmAddress
 * @returns {{}}
 */
osmUtils.convertFromOsmAddress = function(osmAddress) {
    var osmProps = Object.keys(osmAddress);

    var address = {
        addressCountry: osmAddress.country,
        addressPostcode: osmAddress.postcode
    };

    // Find the best "city"
    var cityPropsFound = _.intersection(CITY_PROPS, osmProps);
    if (cityPropsFound.length > 0) {
        address.addressCity = osmAddress[cityPropsFound[0]];

        // If suburb is used, add also the state (the data seems to make the most sense like this)
        if (cityPropsFound[0] === 'suburb' && typeof osmAddress.state !== 'undefined') {
            address.addressCity += ', ' + osmAddress.state;
        }
    }

    // Find the best "street"
    var streetPropsFound = _.intersection(STREET_PROPS, osmProps);
    if (streetPropsFound.length > 0) {
        address.addressStreet = osmAddress[streetPropsFound[0]];

        // Add also the house if we found the street
        address.addressHouse = osmAddress['house_number'];
    }

    return address;
};

module.exports = osmUtils;
