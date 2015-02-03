/* global db */
/**
 * Migrations script to reset all the social graph data to get
 * ready for the new social graph game
 */

try {
    // Remove all babies and mabies
    db.people.remove(
        {password: {$exists: false}}
    );

    // Remove all links and nodes
    db.activitylinks.remove();
    db.graphnodes.remove();

    // Remove the 'role' from the user
    db.people.update(
        {},
        {$unset: {role: ''}},
        {multi: true}
    );
}
catch (e) {
    print(e);
}
