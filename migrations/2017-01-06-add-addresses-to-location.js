/* global db, print, load, data */


load('allParsedStuff.js');

var locationWithAddresses = {};
for (var i = 0; i < data.length; i++) {
    locationWithAddresses[data[i]._id.$oid] = data[i];
}

/**
 * Migration script to add address and osmAddress to existing locations.
 * The addresses come from the OSM Nominatim API.
 */
db.locations.find().forEach(function(location) {
    'use strict';

    var id = location._id.valueOf();
    var locationWithAddress = locationWithAddresses[id];
    if (typeof locationWithAddress !== 'undefined') {
        if (locationWithAddress.coordinates[0] === location.coordinates[0] &&
            locationWithAddress.coordinates[1] === location.coordinates[1])
        {
            try {
                db.locations.update(
                    {_id: location._id},
                    {
                        $set: {
                            osmAddress: locationWithAddress.osmAddress,
                            address: locationWithAddress.address
                        }
                    }
                );
            }
            catch (e) {
                print(e);
            }
        }
        else {
            print('Coordinates did not match for ' + id);
        }
    }
    else {
        print('Could not find address for ' + id);
    }
});
