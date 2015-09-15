/* global db, print */
/**
 * Migrations script to remove available points from all locations
 */

try {
    db.locations.update(
        {},
        {$unset: {availablePoints: ''}},
        {multi: true}
    );
}
catch (e) {
    print(e);
}
