/* global db, print */
/**
 * Migrations script to remove all social graph related collections
 * and properties.
 */

// Remove obsolete collections
db.activities.drop();
db.activitylinks.drop();
db.graphnodes.drop();

// Remove pseudo accounts
db.people.remove({password: {$exists: false}});

// Remove obsolete fields from person
try {
    db.people.update(
        {},
        {$unset: {
            capture: '',
            role: ''
        }},
        {multi: true}
    );
}
catch (e) {
    print(e);
}
